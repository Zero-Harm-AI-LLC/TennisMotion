#
# Make sure to install the required packages before running this script:
# Make you have Python 3.9 as the python version.
# pip install ultralytics coremltools
# This script converts a YOLOv8 model to CoreML format.
#
from ultralytics import YOLO
import os
import coremltools

# === CONFIGURATION ===
pt_model_path = 'best.pt'  # Replace with your trained model

# === LOAD THE MODEL ===
model = YOLO(pt_model_path)

# === EXPORT TO COREML ===
coreml_output = model.export(format='coreml', dynamic=False, optimize=True)
model_path = coremltools.utils.compile_model("best.mlpackage", "yolov8.mlmodelc")
print(f"CoreML model saved at: {coreml_output}")
print(f"Compiled CoreML model saved at: {model_path}")