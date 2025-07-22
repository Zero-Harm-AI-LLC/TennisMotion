
# Training

## Introduction
This section analyzes tennis ball in a video to measure speed and number of shots. It could also analyze if the ball is in or out. It focuses on training and get the models that will be integrated into the mobile app. It will utilize YOLO and CNNNs. 

## Models and Datasets Used
    We can use two separate models for recognition. One model to recognize player and another for recognizing the ball. For instance we can use YOLOv8 for player detection and YOLOv5 for ball detection. However this is a two passes approach in which each frame is pass through both YOLO detection, or we can merge such as: https://y-t-g.github.io/tutorials/yolov8n-add-classes/. Pretrained YOLO models on Ultralytics are trained with the COCO dataset that has predefined (80 classes)[https://gist.github.com/AruniRC/7b3dadd004da04c80198557db5da4bda] such as '0: u'person', 1: u'bicycle', 2: u'car', ..etc

    You will need to add some COCO dataset into your dataset for training, otherwise the model will forget. Use the Python script utils/download_coco_subset.py to download a subset of COCO dataset

* Fine Tuned YOLO v8 for tennis ball detection from ultralytics
* Court Key point extraction using ResNet50 and PyTorch
* The tennis balls dataset can be found on RoboFlow

## Training
* Install the VS Code's plugin Python Data Science
* Tennis ball detetion training with YOLO: [tennis_ball_train/tennis_ball_detection.ipynb]
* Tennis court keypoint with Pytorch: [tennis_court_train/tennis_court_keypoints.ipynb]

## Requirements
* python3.8
* ultralytics
* roboflow
* pytroch
* pandas
* numpy 
