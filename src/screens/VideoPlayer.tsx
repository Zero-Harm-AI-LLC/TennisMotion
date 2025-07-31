import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Text, Alert, Dimensions,
   Modal, TextInput, useWindowDimensions} from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { requestCameraPermission, requestMicrophonePermission} from '../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useVideoContext, VideoItem } from '../context/VideoContext';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import Svg, {Line} from 'react-native-svg';
import { PoseType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';
import { detectPose } from '../utils/detectPose'; 
import { saveVideoToGallery, createVideoThumbnail } from '../utils/gallery';

type RootStackParamList = {
  VideoScreen: undefined;
  // add other screens here if needed
};

const AnimatedLine = Animated.createAnimatedComponent(Line);

type Point = { x: number; y: number } | null;
const usePosition = (p1: Point, p2: Point) => {
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

const VideoPlayer = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [pose, setPose] = useState<PoseType>(defaultPose);
  const dimensions = useWindowDimensions();  

  // Select 16:9 aspect ratio at 1080p resolution (1920x1080)
  const desiredWidth = 1920;
  const desiredHeight = 1080;
  const desiredFps = 30; // You can set to 60 if your device supports it

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

  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { addVideo } = useVideoContext();
  const isFocused = useIsFocused();
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const [strokeModalVisible, setStrokeModalVisible] = useState(true);
  const [selectedStroke, setSelectedStroke] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  let poseArray: PoseType[] = [];

  // pose positions
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

  const strokes: string[] = [
    'Forehand',
    'Backhand',
    'Serve',
    'Approach Shot',
    'Forehand Volley',
    'Backhand Volley',
    'Overhead',
    'Forehand Slice',
    'Backhand Slice',
  ]

  // Request permissions on mount
  useEffect(() => {
   (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted' 
      );
    })();
  }, []);

  const handleModalClose = async () => {
    if (!pendingVideoUri) return;
    try {
      const savedUri = await saveVideoToGallery(pendingVideoUri);  
      setPendingVideoUri(savedUri);
      const posterUri = await createVideoThumbnail(pendingVideoUri);
      console.log("Adding now");
      const item : VideoItem = {title: videoTitle, uri: savedUri, poster: posterUri || '', 
                                stroke: selectedStroke, data: poseArray};
      addVideo(item);
      setTitleModalVisible(false);
      navigation.navigate('VideoScreen');
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to save video to gallery.');
      setTitleModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('VideoScreen');
    }
  };

  const handlePose = useCallback((result: PoseType) => {
    // This runs on the JS thread.
    console.log('Pose:', result);
    // You can call setState, navigation, etc. here
    setPose(result);
    poseArray.push(result);
  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePose);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    if (!isRecording) {
        sendToJS(defaultPose); // Calls JS safely
    }

    const poseObject = detectPose(frame);
    if (!poseObject)
      return;

    const xFactor = dimensions.height / frame.width;
    const yFactor = dimensions.width / frame.height;

    if (__DEV__) {
      console.log('Frame dimensions:', frame.width, frame.height);
      console.log('Screen dimensions:', dimensions.width, dimensions.height);
      console.log('X factor:', xFactor, 'Y factor:', yFactor);
    }
      
    const poseCopy : PoseType = { ...defaultPose };
    console.log('Pose object:', poseObject);
    if (isRecording) {
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
    } 
  }, [sendToJS]);
  

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    poseArray = [];
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          try {
            setPendingVideoUri(video.path.startsWith('file://') ? video.path : `file://${video.path}`);
            setTitleModalVisible(true);
          } catch (e) {
            Alert.alert('Error', 'Failed to save video to gallery.');
          }
          setIsRecording(false);
        },
        onRecordingError: (error) => {
          Alert.alert('Recording Error', error.message || 'Unknown error');
          setIsRecording(false);
        },
      });
    } catch (e) {
      setIsRecording(false);
      Alert.alert('Error', 'Could not start recording.');
    }
  }, [isRecording]);

  const handleStopRecording = useCallback(() => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  }, [isRecording]);

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'none' },
      });
      return () => {
        navigation.getParent()?.setOptions({
          tabBarStyle: undefined, // Restore default
        });
      };
    }, [navigation])
  );

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
      <View style={styles.controlsOverlay}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
            <Icon name="record" size={64} color="#ff0000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <Icon name="stop" size={64} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      <Modal
        animationType="slide"
        visible={titleModalVisible}
        //onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <TextInput
            placeholder="Enter video title"
            value={videoTitle}
            onChangeText={setVideoTitle}
            style={styles.inputText}
          />
          <TouchableOpacity onPress={handleModalClose}>
            <Text>OK</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        visible={strokeModalVisible}
      >
        <View style={styles.modal}>
          <Text style={{color: '#03adfc', fontSize: 24, marginBottom: 20}}>Level</Text>
          <View style={styles.buttonContainer}>
            {strokes.map((stroke) => (
              <TouchableOpacity 
                key={stroke} 
                style={styles.button} 
                onPress={() => {
                  setStrokeModalVisible(false);
                  setSelectedStroke(stroke);
                }}
              >
                <Text>{stroke}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white'},
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  stopButton: {
    alignItems: 'center',
    marginBottom: 10,
  },
  controlText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 0,
    fontWeight: 'bold',
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#000' 
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
  },
  modal: {
    flex: 1,
    //width: '40%',
    //height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    zIndex: 9999,
    backgroundColor: 'rgb(255, 255, 255)',
    padding: 20,
  },
  inputText: {
    borderBottomWidth: 1,
    borderBottomColor: '#03adfc',
    marginBottom: 20,
    paddingTop: 20,
    width: 75,
    alignSelf: 'center',
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  button: {
   borderColor: '#03adfc',
   borderWidth: 1,
   borderRadius: 5,
   padding: 10,
   margin: 5,
   width: '40%',
   alignItems: 'center',
 },
 buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginTop: 20,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});

export default VideoPlayer;