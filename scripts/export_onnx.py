# AI Content Detector - CSC3003S Capstone Project (2025)
# Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

"""Export a checkpoint to ONNX and quantize it to 8 bits, laid out the way transformers.js expects.

Usage: uv run --with "optimum[onnxruntime]" --with "transformers<4.50" python scripts/export_onnx.py SRC OUT
"""

import shutil
import sys
from pathlib import Path

from onnxruntime.quantization import QuantType, quantize_dynamic
from optimum.exporters.onnx import main_export


def main(src: str, out: Path) -> None:
    main_export(src, output=out, task="text-classification")
    (out / "onnx").mkdir(exist_ok=True)
    shutil.move(out / "model.onnx", out / "onnx/model.onnx")
    # Dynamic quantization: weights stored as uint8, activations quantized per input at runtime.
    quantize_dynamic(
        out / "onnx/model.onnx", out / "onnx/model_quantized.onnx", weight_type=QuantType.QUInt8
    )
    print(f"Wrote {out}/onnx/model.onnx and model_quantized.onnx")


if __name__ == "__main__":
    main(sys.argv[1], Path(sys.argv[2]))
