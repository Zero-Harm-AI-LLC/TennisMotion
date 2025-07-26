#
# Make sure to install the required packages before running this script:
# Make you have Python 3.9 as the python version.
# pip install ultralytics coremltools
# This script converts a YOLOv8 model to CoreML format.
#
from ultralytics import YOLO
import shutil
import sys

if len(sys.argv) > 2:
    pt_model_temp = sys.argv[1]
    pt_model_path = sys.argv[2]
    print(f"The model temp is: {pt_model_temp}  model path is: {pt_model_path}")
else:
    print("Not enough arguments provided.")
    sys.exit()

# === CONFIGURATION ===
shutil.copy(pt_model_temp, pt_model_path)  # Copy the model to the specified path

# === LOAD THE MODEL ===
model = YOLO(pt_model_path)

# === EXPORT TO COREML ===
coreml_output = model.export(format='coreml', nms=True, dynamic=False, optimize=True)
