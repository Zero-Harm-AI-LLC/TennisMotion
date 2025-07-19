
# Training

## Introduction
This section analyzes tennis ball in a video to measure speed and number of shots. It could also analyze if the ball is in or out. It focuses on training and get the models that will be integrated into the mobile app. It will utilize YOLO and CNNNs. 

## Models and Datasets Used
* YOLO v8 for player detection from 
* Fine Tuned YOLO v5 for tennis ball detection from ultralytics
* Court Key point extraction using ResNet50 and PyTorch
* The tennis balls dataset can be found on RoboFlow

## Training
* Install the VS Code's plugin Python Data Science
* Tennis ball detetion training with YOLO: training/ball_detect_training.ipynb
* Tennis court keypoint with Pytorch: training/court_keypoints_training.ipynb

## Requirements
* python3.8
* ultralytics
* roboflow
* pytroch
* pandas
* numpy 
