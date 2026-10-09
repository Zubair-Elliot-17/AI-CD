# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import pytest

from app.analysis import analyse, split_sentences, verdict_for
from app.detector import clean_text


def test_split_keeps_offsets_into_original_text():
    text = "First sentence here.  Second one!\n\nThird? Yes."
    spans = split_sentences(text)
    assert [s.text for s in spans] == ["First sentence here.", "Second one!", "Third?", "Yes."]
    for s in spans:
        assert text[s.start : s.end] == s.text


def test_split_does_not_break_on_abbreviations():
    text = "Dr. Smith met Mr. Jones in the U.S. last week. They talked e.g. about A. Turing."
    spans = split_sentences(text)
    assert len(spans) == 2
    assert spans[0].text.endswith("last week.")


def test_split_treats_line_breaks_as_boundaries():
    spans = split_sentences("A heading\nBody text follows here")
    assert [s.text for s in spans] == ["A heading", "Body text follows here"]


@pytest.mark.parametrize(
    ("p", "verdict"), [(0.9, "ai"), (0.7, "ai"), (0.5, "mixed"), (0.1, "human")]
)
def test_verdict_thresholds(p, verdict):
    assert verdict_for(p) == verdict


def test_analyse_scores_sentences_and_overall(detector):
    text = (
        "I walked the dog this morning before work. "
        "It rained a lot so we came back early. "
        "Short one. "
        "Let us delve into the multifaceted tapestry of modern canine care."
    )
    result = analyse(text, detector)
    assert result.word_count == len(text.split())
    scored = {s.text: s.ai_probability for s in result.sentences}
    assert scored["Short one."] is None
    # Last sentence's window contains "delve", first sentence's window doesn't.
    assert scored["I walked the dog this morning before work."] == pytest.approx(0.05)
    assert scored[result.sentences[-1].text] == pytest.approx(0.95)
    # One chunk containing "delve" drives the overall score.
    assert result.verdict == "ai"


def test_analyse_batches_into_one_model_call(detector):
    analyse("One two three four five. Six seven eight nine ten. " * 20, detector)
    assert len(detector.calls) == 1


def test_clean_text_strips_markdown():
    md = "# Title\n\n**Bold** and [a link](http://x.y) with `code` and snake_case_name."
    assert clean_text(md) == "Title Bold and a link with and snake_case_name."


def test_mixed_document_gets_mixed_verdict(detector):
    human = "I fixed the bike chain on Sunday with a borrowed tool from next door. " * 3
    ai = "Moreover, we must delve into the importance of regular bicycle maintenance. " * 3
    result = analyse(human + "\n\n" + ai, detector)
    assert result.ai_probability > 0.9  # one chunk, contains "delve"
    assert 0.2 < result.ai_sentence_share < 0.8
    assert result.verdict == "mixed"
