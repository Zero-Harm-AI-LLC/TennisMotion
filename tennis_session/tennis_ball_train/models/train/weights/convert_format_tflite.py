#
# Make sure to install the required packages before running this script:
# Make you have Python 3.9 as the python version.
# pip install ultralytics
# pip install torch
# pip install tensorflow==2.13.0
# pip install onnx tf2onnx onnxruntime
# This script converts a YOLOv8 model to CoreML format.
#
from ultralytics import YOLO
import os

# === CONFIGURATION ===
pt_model_path = 'best.pt'  # Replace with your trained model
output_dir = 'converted_models'  # Where to save converted models
os.makedirs(output_dir, exist_ok=True)

# === LOAD THE MODEL ===
model = YOLO(pt_model_path)

# === EXPORT TO TFLITE ===
tflite_output = model.export(format='tflite')
print(f"TFLite model saved at: {tflite_output}")
