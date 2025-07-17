import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Text, Alert, Modal, TextInput, useWindowDimensions} from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createThumbnail } from 'react-native-create-thumbnail';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission} from '../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoContext } from '../context/VideoContext';
import { useAnimatedProps } from 'react-native-reanimated';
import Animated from 'react-native-reanimated/lib/typescript/Animated';
import Svg, {Line} from 'react-native-svg';
import { PoseType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';

type RootStackParamList = {
  VideoScreen: undefined;
  // add other screens here if needed
};

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

const VideoPlayer = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const { videos } = useVideoContext();
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
  const [modalVisible, setModalVisible] = useState(false);
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);

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

  // Create thumbnail for the video
  const createVideoThumbnail = async (videoUri: string) => {    
    try {
      const thumbnail = await createThumbnail({
        url: videoUri,
        timeStamp: 1000, // 1 second into the video
      });
      return thumbnail.path;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return null;
    }
  }

  const handleModalClose = async () => {
    if (!pendingVideoUri) return;
    try {
      await CameraRoll.save(pendingVideoUri, { type: 'video' });
      const posterUri = await createVideoThumbnail(pendingVideoUri);
      for (let i = 0; i < videos.length; i++) {
        console.log(videos[i].vidId);
      }
      console.log("Attempting to add: " + videoTitle);
      AsyncStorage.getAllKeys().then(keys => {
        keys.forEach(key => {
          console.log("Key: " + key);
        });
      });
      console.log("Adding now");
      addVideo(videoTitle, pendingVideoUri, posterUri || '');
      console.log("Video successfully added: " + videoTitle);
      //await CameraRoll.save(pendingVideoUri, { type: 'video' });
      setModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('VideoScreen');
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to save video to gallery.');
      setModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('VideoScreen');
    }
  };

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          try {
            let vidNum = await AsyncStorage.getItem("NumVideos");
            if (vidNum === null) {
              vidNum = "5";
            }
            /*
            for (let i = 0; i < videos.length; i++) {
              console.log(videos[i].id);
            }
              */
            //AsyncStorage.setItem("NumVideos", vidNum);
            setVideoTitle("Video " + vidNum);
            console.log("Initial Title: " + videoTitle + ", vidNum: " + vidNum);
            await AsyncStorage.setItem("NumVideos", (parseInt(vidNum) + 1).toString());
            console.log("NumVideos value stored: ", await AsyncStorage.getItem("NumVideos"));
            setPendingVideoUri(video.path.startsWith('file://') ? video.path : `file://${video.path}`);
            setModalVisible(true);
          } catch (e) {
            Alert.alert('Error', 'Failed to save video to gallery.');
          }
          setIsRecording(false);
          //navigation.navigate('VideoScreen'); // <-- Navigate away after recording
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
  }, [isRecording, navigation, addVideo]);

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
      />
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
        visible={modalVisible}
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
    marginBottom: 0,
  },
  stopButton: {
    alignItems: 'center',
    marginBottom: 0,
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
  }
});

export default VideoPlayer;