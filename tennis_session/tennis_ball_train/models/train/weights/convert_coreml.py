#
# Make sure to install the required packages before running this script:
# Make you have Python 3.9 as the python version.
# pip install ultralytics coremltools
# This script converts a YOLOv8 model to CoreML format.
#
from ultralytics import YOLO
model = YOLO("yolov5_nms.pt")

# === EXPORT TO COREML ===
coreml_output = model.export(format='coreml', nms=True, dynamic=False, optimize=True)
