import React, { useEffect, useState, useRef, useMemo, useCallback} from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions, useWindowDimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import Animated, { useSharedValue, runOnJS, useAnimatedStyle, useAnimatedProps} from 'react-native-reanimated';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { detectPose } from '../utils/detectPose'; 
//import { Canvas, Skia, PaintStyle, Circle, Rect, Line, vec } from "@shopify/react-native-skia";
import { useIsFocused } from '@react-navigation/native';
import Svg, {Line, Rect} from 'react-native-svg';
import { PoseType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';

//const { width, height } = Dimensions.get('window');

const AnimatedLine = Animated.createAnimatedComponent(Line);

const usePosition = (p1, p2) => {
  if (p1 && p2) {
    return ( 
      useAnimatedProps(() => ({
        x1: p1.x,
        y1: p1.y,
        x2: p2.x,
        y2: p2.y,
      }))
    );
  }
  else {
    return (
      useAnimatedProps(() => ({
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
      }))
    );
  }
};

const defaultPose = {
  leftShoulderPosition: {x: 0, y: 0},
  rightShoulderPosition: {x: 0, y: 0},
  leftElbowPosition: {x: 0, y: 0},
  rightElbowPosition: {x: 0, y: 0},
  leftWristPosition: {x: 0, y: 0},
  rightWristPosition: {x: 0, y: 0},
  leftHipPosition: {x: 0, y: 0},
  rightHipPosition: {x: 0, y: 0},
  leftKneePosition: {x: 0, y: 0},
  rightKneePosition: {x: 0, y: 0},
  leftAnklePosition: {x: 0, y: 0},
  rightAnklePosition: {x: 0, y: 0},
  leftPinkyPosition: {x: 0, y: 0},
  rightPinkyPosition: {x: 0, y: 0},
  leftIndexPosition: {x: 0, y: 0},
  rightIndexPosition: {x: 0, y: 0},
  leftThumbPosition: {x: 0, y: 0},
  rightThumbPosition: {x: 0, y: 0},
  leftHeelPosition: {x: 0, y: 0},
  rightHeelPosition: {x: 0, y: 0},
  nosePosition: {x: 0, y: 0},
  leftFootIndexPosition: {x: 0, y: 0},
  rightFootIndexPosition: {x: 0, y: 0},
  leftEyeInnerPosition: {x: 0, y: 0},
  rightEyeInnerPosition: {x: 0, y: 0},
  leftEyePosition: {x: 0, y: 0},
  rightEyePosition: {x: 0, y: 0},
  leftEyeOuterPosition: {x: 0, y: 0},
  rightEyeOuterPosition: {x: 0, y: 0},
  leftEarPosition: {x: 0, y: 0},
  rightEarPosition: {x: 0, y: 0},
  leftMouthPosition: {x: 0, y: 0},
  rightMouthPosition: {x: 0, y: 0},
}

const PoseScreen = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [pose, setPose] = useState<PoseType>(defaultPose);
  const isFocused = useIsFocused();
  const dimensions = useWindowDimensions();

  const leftWristToElbowPosition = usePosition(pose.leftWristPosition, pose.leftElbowPosition);
  const leftElbowToShoulderPosition = usePosition(pose.leftElbowPosition, pose.leftShoulderPosition);
  const leftShoulderToHipPosition = usePosition(pose.leftShoulderPosition, pose.leftHipPosition);
  const leftHipToKneePosition = usePosition(pose.leftHipPosition, pose.leftKneePosition);
  const leftKneeToAnklePosition = usePosition(pose.leftKneePosition, pose.leftAnklePosition);
  const leftIndexToThumbPostion = usePosition(pose.leftIndexPosition, pose.leftThumbPosition);
  const leftWristToThumbPostion = usePosition(pose.leftWristPosition, pose.leftThumbPosition);
  const leftIndexToPinkyPostion = usePosition(pose.leftIndexPosition, pose.leftPinkyPosition);
  const leftWristToPinkyPostion = usePosition(pose.leftWristPosition, pose.leftPinkyPosition);
  const leftHeelToFootPosition = usePosition(pose.leftHeelPosition, pose.leftFootIndexPosition);
  const leftHeelToAnklePosition = usePosition(pose.leftHeelPosition, pose.leftAnklePosition);
  const leftEyeInnerToEyePosition = usePosition(pose.leftEyeInnerPosition, pose.leftEyePosition);
  const leftEyeOuterToEyePosition = usePosition(pose.leftEyeOuterPosition, pose.leftEyePosition);

  const rightWristToElbowPosition = usePosition(pose.rightWristPosition, pose.rightElbowPosition);
  const rightElbowToShoulderPosition = usePosition(pose.rightElbowPosition, pose.rightShoulderPosition);
  const rightShoulderToHipPosition = usePosition(pose.rightShoulderPosition, pose.rightHipPosition);
  const rightHipToKneePosition = usePosition(pose.rightHipPosition, pose.rightKneePosition);
  const rightKneeToAnklePosition = usePosition(pose.rightKneePosition, pose.rightAnklePosition);
  const rightIndexToThumbPostion = usePosition(pose.rightIndexPosition, pose.rightThumbPosition);
  const rightWristToThumbPostion = usePosition(pose.rightWristPosition, pose.rightThumbPosition);
  const rightIndexToPinkyPostion = usePosition(pose.rightIndexPosition, pose.rightPinkyPosition);
  const rightWristToPinkyPostion = usePosition(pose.rightWristPosition, pose.rightPinkyPosition);
  const rightHeelToFootPosition = usePosition(pose.rightHeelPosition, pose.rightFootIndexPosition);
  const rightHeelToAnklePosition = usePosition(pose.rightHeelPosition, pose.rightAnklePosition);
  const rightEyeInnerToEyePosition = usePosition(pose.rightEyeInnerPosition, pose.rightEyePosition);
  const rightEyeOuterToEyePosition = usePosition(pose.rightEyeOuterPosition, pose.rightEyePosition);

  const shoulderToShoulderPosition = usePosition(pose.leftShoulderPosition, pose.rightShoulderPosition);
  const hipToHipPosition = usePosition(pose.leftHipPosition, pose.rightHipPosition);
  const mouthPosition = usePosition(pose.leftMouthPosition, pose.rightMouthPosition);
  

  // Select 16:9 aspect ratio at 1080p resolution (1920x1080)
  const desiredWidth = 1920;
  const desiredHeight = 1080;
  const desiredFps = 30; // You can set to 60 if your device supports it

  // Use useMemo to optimize format selection
  const format = useMemo(() => {
    if (!device?.formats) return undefined;
    // Find a format that matches 1920x1080 and supports at least 30fps
    return (
      device.formats.find(
        (f) => (
          f.videoWidth === desiredWidth &&
          f.videoHeight === desiredHeight &&
          f.minFps <= desiredFps && desiredFps <= f.maxFps)
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

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      //const galleryStatus = await requestGalleryPermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted' 
        //&& galleryStatus === 'granted'
      );
    })();
  }, []);

  // There might be a black screen
  // A fix might be: https://github.com/mrousavy/react-native-vision-camera/issues/2951
  // which needs a patch to the code
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const poseObject = detectPose(frame);
    const xFactor = dimensions.height / frame.width;
    const yFactor = dimensions.width / frame.height;

    //console.log('Frame dimensions:', frame.width, frame.height);
    //console.log('Screen dimensions:', dimensions.width, dimensions.height);
    //console.log('X factor:', xFactor, 'Y factor:', yFactor);
     
    const poseCopy : PoseType = { ...defaultPose };
    console.log('Pose object:', poseObject);

    Object.keys(poseCopy).forEach((key) => {
      const point = poseObject[key];
      //console.log('Pose key:', key, 'Point:', point);
      if (point) {
        poseCopy[key as keyof PoseType] = {
          y: point.x * yFactor,
          x: dimensions.width - (point.y * xFactor),
        };
        console.log('Pose copy for key:', key, " point: ", point);
      }
    });
  
    console.log('Pose copy:',  poseCopy);
    sendToJS(poseCopy); // Calls JS safely
  }, [sendToJS]);

  
  if (!device || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  /*
  function DrawLine({p1, p2}) {
    if ((p1.x == 0 && p1.y == 0) || (p2.x == 0 && p2.y == 0)) {
      return null;
    }
    else {
      return (
        <View>
          <Line 
          x1={p1.x} 
          y1={p1.y} 
          x2={p2.x} 
          y2={p2.y} 
          stroke="lime" 
          strokeWidth="2" />
        </View>
      )
    }
  }
  */
  
  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused && permissionsGranted}
        video={true}
        audio={true}
        format={format}
        fps={desiredFps}
        onError={(error) => console.error('Camera error:', error)}
        frameProcessor={frameProcessor}
      />
      <Svg
        height={dimensions.height}
        width={dimensions.width}
        style={styles.linesContainer}
      >
        {/*
        <AnimatedLine animatedProps={leftWristToElbowPosition} stroke="red" strokeWidth="2"/>
        <AnimatedLine style={leftWristToElbowPosition} stroke="red" strokeWidth="2"/>
        <AnimatedLine />
        <DrawLine p1={pose.leftWristPosition} p2={pose.leftElbowPosition}/>
        <DrawLine p1={pose.leftElbowPosition} p2={pose.leftShoulderPosition}/>
        <DrawLine p1={pose.leftShoulderPosition} p2={pose.leftHipPosition}/>
        <DrawLine p1={pose.leftHipPosition} p2={pose.leftKneePosition}/>
        <DrawLine p1={pose.leftKneePosition} p2={pose.leftAnklePosition}/>
        <DrawLine p1={pose.rightWristPosition} p2={pose.rightElbowPosition}/>
        <DrawLine p1={pose.rightElbowPosition} p2={pose.rightShoulderPosition}/>
        <DrawLine p1={pose.rightShoulderPosition} p2={pose.rightHipPosition}/>
        <DrawLine p1={pose.rightHipPosition} p2={pose.rightKneePosition}/>
        <DrawLine p1={pose.rightKneePosition} p2={pose.rightAnklePosition}/>

        <DrawLine p1={pose.leftShoulderPosition} p2={pose.rightShoulderPosition}/>
        <DrawLine p1={pose.leftHipPosition} p2={pose.rightHipPosition}/>

        <DrawLine p1={pose.leftIndexPosition} p2={pose.leftThumbPosition}/>
        <DrawLine p1={pose.leftIndexPosition} p2={pose.leftPinkyPosition}/>
        <DrawLine p1={pose.leftWristPosition} p2={pose.leftPinkyPosition}/>
        <DrawLine p1={pose.leftWristPosition} p2={pose.leftThumbPosition}/>

        <DrawLine p1={pose.rightIndexPosition} p2={pose.rightThumbPosition}/>
        <DrawLine p1={pose.rightIndexPosition} p2={pose.rightPinkyPosition}/>
        <DrawLine p1={pose.rightWristPosition} p2={pose.rightPinkyPosition}/>
        <DrawLine p1={pose.rightWristPosition} p2={pose.rightThumbPosition}/>

        <DrawLine p1={pose.leftHeelPosition} p2={pose.leftAnklePosition}/>
        <DrawLine p1={pose.leftHeelPosition} p2={pose.leftFootIndexPosition}/>
        <DrawLine p1={pose.rightHeelPosition} p2={pose.rightAnklePosition}/>
        <DrawLine p1={pose.rightHeelPosition} p2={pose.rightFootIndexPosition}/>
        <DrawLine p1={pose.leftEyeInnerPosition} p2={pose.leftEyePosition}/>
        <DrawLine p1={pose.leftEyePosition} p2={pose.leftEyeOuterPosition}/>
        <DrawLine p1={pose.rightEyeInnerPosition} p2={pose.rightEyePosition}/>
        <DrawLine p1={pose.rightEyeOuterPosition} p2={pose.rightEyePosition}/>
        <DrawLine p1={pose.leftMouthPosition} p2={pose.rightMouthPosition}/>
        */}
        <AnimatedLine animatedProps={leftWristToElbowPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftElbowToShoulderPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftShoulderToHipPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftHipToKneePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftKneeToAnklePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightWristToElbowPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightElbowToShoulderPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightShoulderToHipPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightHipToKneePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightKneeToAnklePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={shoulderToShoulderPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={hipToHipPosition} stroke="red" strokeWidth="2" />

        <AnimatedLine animatedProps={leftIndexToThumbPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftIndexToPinkyPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftWristToPinkyPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftWristToThumbPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightIndexToThumbPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightIndexToPinkyPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightWristToPinkyPostion} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightWristToThumbPostion} stroke="red" strokeWidth="2" />

        <AnimatedLine animatedProps={leftHeelToAnklePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftHeelToFootPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightHeelToAnklePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightHeelToFootPosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftEyeInnerToEyePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={leftEyeOuterToEyePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightEyeInnerToEyePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={rightEyeOuterToEyePosition} stroke="red" strokeWidth="2" />
        <AnimatedLine animatedProps={mouthPosition} stroke="red" strokeWidth="2" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  /*
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    Dimensions.get('window').width,
    Dimensions.get('window').height,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  */
  poseText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  }
});

export default PoseScreen;
