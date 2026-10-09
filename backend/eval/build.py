# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Build the test and calibration sets from public datasets. Usage: python -m eval.build

The test set uses COLING's dev split and the calibration set its train split, so tuning
the verdict thresholds never sees a test text.
"""

from pathlib import Path

import pandas as pd
from huggingface_hub import hf_hub_download

DATA = Path(__file__).parent / "data"
OUT = DATA / "benchmark.jsonl"
CALIBRATION = DATA / "calibration.jsonl"
SEED = 17
MIN_WORDS, MAX_WORDS = 60, 600

# Recent generators in the COLING-2025 MGT dev split.
COLING_MODELS = ["gpt4o", "gpt4", "llama3-70b", "llama3-8b", "gemma2-9b-it", "mixtral-8x7b"]
COLING_PER_MODEL = 150
CLAUDE_PER_MODEL = 100
MIXED_DOCS = 150
COLUMNS = ["id", "text", "kind", "label", "dataset", "generator", "domain"]


def _load(repo: str, path: str, columns: dict[str, str]) -> pd.DataFrame:
    """Read a dataset's parquet export, renaming `columns` to our schema."""
    file = hf_hub_download(repo, path, repo_type="dataset", revision="refs/convert/parquet")
    df = pd.read_parquet(file, columns=list(columns)).rename(columns=columns)
    df = df.drop_duplicates("text")
    return df[df.text.str.split().str.len().between(MIN_WORDS, MAX_WORDS)]


def _per_group(df: pd.DataFrame, key: str, n: int) -> pd.DataFrame:
    return df.groupby(key).sample(n=n, random_state=SEED)


def persuasion() -> pd.DataFrame:
    """Anthropic/persuasion: human and Claude arguments for the same claims (CC BY-NC-SA 4.0).

    Each human argument appears once per rater, so only 174 are unique.
    """
    columns = {"argument": "text", "source": "generator"}
    df = _load("Anthropic/persuasion", "default/train/0000.parquet", columns)
    human = df[df.generator == "Human"].assign(generator="human")
    claude = df[~df.generator.isin(["Human", "Control"])]
    claude = _per_group(claude, "generator", CLAUDE_PER_MODEL)
    out = pd.concat([human, claude], ignore_index=True)
    return out.assign(
        id=[f"persuasion-{i}" for i in range(len(out))],
        dataset="persuasion",
        domain="argument",
    )


def coling(split: str, file: str, per_model: int) -> pd.DataFrame:
    """COLING-2025 MGT shared task, limited to recent generators, plus synthetic mixed docs."""
    df = _load(
        "Jinyan1/COLING_2025_MGT_en",
        f"default/{split}/{file}",
        {"id": "id", "text": "text", "model": "generator", "sub_source": "domain"},
    )
    ai = _per_group(df[df.generator.isin(COLING_MODELS)], "generator", per_model)
    # Human texts come from the same domains, in the same proportions, as the AI ones.
    humans = df[df.generator == "human"]
    human = pd.concat(
        humans[humans.domain == domain].sample(n=n, random_state=SEED)
        for domain, n in ai.domain.value_counts().items()
    )
    rest = df.drop(ai.index.union(human.index))
    return pd.concat([ai.assign(dataset="coling"), human.assign(dataset="coling"), mixed(rest)])


def mixed(pool: pd.DataFrame) -> pd.DataFrame:
    """A human text with an AI passage from the same domain pasted before or after it."""
    pool = pool[pool.text.str.split().str.len() <= MAX_WORDS // 2]
    humans = pool[pool.generator == "human"].sample(frac=1, random_state=SEED)
    ais = pool[pool.generator.isin(COLING_MODELS)].sample(frac=1, random_state=SEED)
    rows = []
    for h in humans.itertuples():
        match = ais[ais.domain == h.domain]
        if match.empty:
            continue
        a = match.iloc[0]
        ais = ais.drop(match.index[0])
        parts = [h.text.strip(), a.text.strip()]
        if len(rows) % 2:
            parts.reverse()
        rows.append(
            {
                "id": f"mixed-{h.id}-{a.id}",
                "text": "\n\n".join(parts),
                "generator": a.generator,
                "domain": h.domain,
                "dataset": "mixed",
            }
        )
        if len(rows) == MIXED_DOCS:
            break
    return pd.DataFrame(rows)


def _finish(df: pd.DataFrame, path: Path) -> None:
    df["kind"] = "ai"
    df.loc[df.generator == "human", "kind"] = "human"
    df.loc[df.dataset == "mixed", "kind"] = "mixed"
    # Mixed documents have no binary label; they only count towards verdict accuracy.
    df["label"] = df.kind.map({"human": 0, "ai": 1, "mixed": -1})
    path.parent.mkdir(exist_ok=True)
    df[COLUMNS].to_json(path, orient="records", lines=True, force_ascii=False)
    print(df.groupby(["dataset", "kind"]).size().to_string())
    print(f"Wrote {len(df)} texts to {path}\n")


def main() -> None:
    test = pd.concat(
        [persuasion(), coling("dev", "0000.parquet", COLING_PER_MODEL)], ignore_index=True
    )
    calibration = coling("train", "0000.parquet", 100).reset_index(drop=True)
    # The shared task has a few near-duplicates across splits; keep them out of calibration.
    seen = {t[:200] for t in test.text}
    calibration = calibration[~calibration.text.str[:200].isin(seen)].copy()
    _finish(test, OUT)
    _finish(calibration, CALIBRATION)


if __name__ == "__main__":
    main()
