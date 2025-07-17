import React, { useEffect, useState, useMemo, useCallback } from 'react';
import 'react-native-reanimated';
import {
  Dimensions,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Camera, useFrameProcessor, useCameraDevices } from 'react-native-vision-camera';
import { requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { detectPose } from '../utils/detectPose';
import { PoseType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';

const defaultPose : PoseType = {
  leftShoulderPosition: { x: 0, y: 0 },
  rightShoulderPosition: { x: 0, y: 0 },
  leftElbowPosition: { x: 0, y: 0 },
  rightElbowPosition: { x: 0, y: 0 },
  leftWristPosition: { x: 0, y: 0 },
  rightWristPosition: { x: 0, y: 0 },
  leftHipPosition: { x: 0, y: 0 },
  rightHipPosition: { x: 0, y: 0 },
  leftKneePosition: { x: 0, y: 0 },
  rightKneePosition: { x: 0, y: 0 },
  leftAnklePosition: { x: 0, y: 0 },
  rightAnklePosition: { x: 0, y: 0 },
};

const desiredWidth = 1920;
const desiredHeight = 1080;
const desiredFps = 30; // You can set to 60 if your device supports it

const PoseDraw = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [pose, setPose] = useState<PoseType>(defaultPose);
  
  const dimensions = useWindowDimensions();

  const format = useMemo(() => {
    if (!device?.formats) return undefined;
    return (
      device.formats.find(
        (f) =>
          f.videoWidth === desiredWidth &&
          f.videoHeight === desiredHeight &&
          f.minFps <= desiredFps &&
          desiredFps <= f.maxFps
      ) || device.formats[0]
    );
  }, [device, desiredWidth, desiredHeight, desiredFps]);

  const handlePose = useCallback((result: any) => {
    // This runs on the JS thread.
    console.log('Pose:', result);
    // You can call setState, navigation, etc. here
    setPose(result);
  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePose);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const poseObject = detectPose(frame);

    // turn 90 degrees clockwise
    // This is necessary because the camera frame is rotated 90 degrees clockwise
    // and we need to adjust the coordinates accordingly.
    // The frame width and height are swapped in the poseObject.
    const yFactor = dimensions.width / frame.height;
    const xFactor = dimensions.height / frame.width;
    /*
      On iOS and Android, front camera preview is usually mirrored by default.
      But ML models (like Google MLKit) return non-mirrored image coordinates.
      So, when you draw keypoints or overlays (e.g., using Skia, Canvas, or SVG) on 
      top of the preview, the drawing doesn't match unless you correct for the mirroring.
      To fix this, you can apply a horizontal flip to the coordinates of the keypoints.
      */
    const flipHorizontal = (x: number) => dimensions.width - x;
    // Log frame and dimensions for debugging
    console.log('Frame dimensions:', frame.width, frame.height);
    console.log('Screen dimensions:', dimensions.width, dimensions.height);
    console.log('X factor:', xFactor, 'Y factor:', yFactor);

    const poseCopy : PoseType = { ...defaultPose };
    console.log('Pose object:', poseObject);

    Object.keys(poseCopy).forEach((key) => {
      const point = poseObject[key];
      if (point) {
         poseCopy[key as keyof PoseType] = {
          x: flipHorizontal(point.y * xFactor),
          y: point.x * yFactor,
        };
      }
    });

    console.log('Pose copy:',  poseCopy);
    sendToJS(poseCopy); // Calls JS safely
  }, [sendToJS]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      setPermissionsGranted(
        cameraStatus === 'granted' && micStatus === 'granted'
      );
    })();
  }, []);

  if (!device || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        frameProcessor={frameProcessor}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={permissionsGranted}
        video={true}
        audio={true}
        format={format}
        fps={desiredFps}
        onError={(error) => console.error('Camera error:', error)}
      />
       <Svg
        height={dimensions.height}
        width={dimensions.width}
        style={styles.linesContainer}
      >
        {/* LEFT SIDE */}
        <Line
          x1={pose.leftWristPosition.x}
          y1={pose.leftWristPosition.y}
          x2={pose.leftElbowPosition.x}
          y2={pose.leftElbowPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.leftElbowPosition.x}
          y1={pose.leftElbowPosition.y}
          x2={pose.leftShoulderPosition.x}
          y2={pose.leftShoulderPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.leftShoulderPosition.x}
          y1={pose.leftShoulderPosition.y}
          x2={pose.leftHipPosition.x}
          y2={pose.leftHipPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.leftHipPosition.x}
          y1={pose.leftHipPosition.y}
          x2={pose.leftKneePosition.x}
          y2={pose.leftKneePosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.leftKneePosition.x}
          y1={pose.leftKneePosition.y}
          x2={pose.leftAnklePosition.x}
          y2={pose.leftAnklePosition.y}
          stroke="red"
          strokeWidth="2"
        />

        {/* RIGHT SIDE */}
        <Line
          x1={pose.rightWristPosition.x}
          y1={pose.rightWristPosition.y}
          x2={pose.rightElbowPosition.x}
          y2={pose.rightElbowPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.rightElbowPosition.x}
          y1={pose.rightElbowPosition.y}
          x2={pose.rightShoulderPosition.x}
          y2={pose.rightShoulderPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.rightShoulderPosition.x}
          y1={pose.rightShoulderPosition.y}
          x2={pose.rightHipPosition.x}
          y2={pose.rightHipPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.rightHipPosition.x}
          y1={pose.rightHipPosition.y}
          x2={pose.rightKneePosition.x}
          y2={pose.rightKneePosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.rightKneePosition.x}
          y1={pose.rightKneePosition.y}
          x2={pose.rightAnklePosition.x}
          y2={pose.rightAnklePosition.y}
          stroke="red"
          strokeWidth="2"
        />

        {/* CENTER LINES */}
        <Line
          x1={pose.leftShoulderPosition.x}
          y1={pose.leftShoulderPosition.y}
          x2={pose.rightShoulderPosition.x}
          y2={pose.rightShoulderPosition.y}
          stroke="red"
          strokeWidth="2"
        />
        <Line
          x1={pose.leftHipPosition.x}
          y1={pose.leftHipPosition.y}
          x2={pose.rightHipPosition.x}
          y2={pose.rightHipPosition.y}
          stroke="red"
          strokeWidth="2"
        />
      </Svg> 
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
});

export default PoseDraw;
