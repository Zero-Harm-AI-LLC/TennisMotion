import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import Animated, { useSharedValue, runOnJS, useAnimatedStyle} from 'react-native-reanimated';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { detectPose } from '../utils/detectPose'; 
//import { Canvas, Skia, PaintStyle, Circle, Rect, Line, vec } from "@shopify/react-native-skia";
import { useIsFocused } from '@react-navigation/native';
import Svg, {Line, Rect} from 'react-native-svg';


//const { width, height } = Dimensions.get('window');


const usePosition = (pose, valueName1, valueName2) => {
  return useAnimatedStyle(
    () => ({
      x1: pose.value[valueName1]["x"],
      y1: pose.value[valueName1]["y"],
      x2: pose.value[valueName2]["x"],
      y2: pose.value[valueName2]["y"],
    }),
    [pose],
  );
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
  const pose = useSharedValue(null);
  const isFocused = useIsFocused();

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
    // Call your native plugin to detect the Pose
    // Use runOnJS to update state in the React context
    // This is necessary because the frame processor runs on a separate thread
    const result = detectPose(frame);

    const xFactor = dim.width / frame.width;
    const yFactor = dim.height / frame.height;

    const poseCopy = {
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

    Object.keys(result).forEach(v => {
      poseCopy[v] = {
        x: result[v]["x"] * xFactor,
        y: result[v]["y"] * yFactor,
      };
    });

    // console.log("Width:", frame.width, "Height", frame.height);
    pose.value = poseCopy;
    console.log('Pose result:', pose);
    /*
    if (pose.value != null) {
      var thumbPos = pose.value["rightThumbPosition"];
      var wristPos = pose.value["rightWristPosition"];
      console.log('Thumb Pos:', pose.value["rightThumbPosition"]);
      if (pose.value["rightThumbPosition"] != null) {
        console.log("Thumb x position:", pose.value["rightThumbPosition"]["x"]);
      }
      console.log('Wrist Pos:', pose.value["rightWristPosition"]);
      if (pose.value["rightWristPosition"] != null) {
        console.log("Wrist y position:", pose.value["rightWristPosition"]["y"]);
      }
    }
    //line = drawLine("rightThumbPosition", "rightWristPosition");
    */
  }, [pose]);

  /*
  const drawLine = (point1: string, point2: string) => {
    console.log("Line Draw");
    if (pose.value != null && pose.value[point1] != null && pose.value[point2] != null) {
      return (
        <Line
          p1={vec(pose.value[point1]["x"], pose.value[point1]["y"])}
          p2={vec(pose.value[point2]["x"], pose.value[point2]["y"])}
          color="red"
          strokeWidth={4}
        />
      );
    }
    else {
      return null;
    }
  }
    */
  


  if (!device || !permissionsGranted) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  const print = () => {
    console.log("hello");
    return (
      <View>
      </View>
    );
  }

  //const size = useSharedValue({ width: width, height: height });

  const AnimatedLine = Animated.createAnimatedComponent(Line);
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
        height={Dimensions.get('window').height}
        width={Dimensions.get('window').width}
        style={styles.linesContainer}>
        <Rect x="15" y="15" width="70" height="70" stroke="red" strokeWidth="2" fill="yellow" />
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
      </Svg>
      {/*
      <Canvas style={{ flex: 1, position: 'absolute', width: 1920, height: 1080 }}>
        <Circle cx={10} cy={10} r={20} color="red" />
        <Rect x={0} y={0} width={i+100} height={i+100} color="lightblue" />
        {line}
        {print()}
        {(pose.value != null ) ? (//&& pose.value["rightThumbPosition"] != null && pose.value["rightWristPosition"] != null) ? (
          <View>
            <Line
            p1={vec(0, 0)}
            p2={vec(256, 256)}
            color="lightblue"
            style="stroke"
            strokeWidth={4}
          />
          <Rect x={0} y={0} width={200} height={200} color="lightblue" />
          </View>
        
          
          <Line
            p1={vec(pose.value["rightThumbPosition"]["x"], pose.value["rightThumbPosition"]["y"])}
            p2={vec(pose.value["rightWristPosition"]["x"], pose.value["rightWristPosition"]["y"])}
            color="red"
            strokeWidth={4}
          />
          
        ) : null }
        */}
      
        {/*drawLine("rightThumbPosition", "rightWristPosition")*/}
        {/*
        <Rect
          x={0}
          y={0}
          width={width / 10}
          height={height / 10}
          color="rgba(0, 0, 0, 0.15)"
        /> 
        {pose.value != null && 
        pose.value["rightThumbPosition"] != null && 
        pose.value["rightWristPosition"] != null ? (
          <Line
            p1={vec(pose.value["rightThumbPosition"]["x"], pose.value["rightThumbPosition"]["y"])}
            p2={vec(pose.value["rightWristPosition"]["x"], pose.value["rightWristPosition"]["y"])}
            color="red"
            strokeWidth={4}
          />
        ) : null }

        {print()}
        {pose.value &&
          pose.value["rightThumbPosition"] &&
          pose.value["rightWristPosition"] ? (
          drawLine(pose.value["rightThumbPosition"], pose.value["rightWristPosition"])
        ) : null}
         
      </Canvas>
      */}
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
