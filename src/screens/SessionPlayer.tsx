import React, { useEffect,useRef, useState, useMemo, useCallback } from 'react';
import 'react-native-reanimated';
import { View, Text, SafeAreaView, TextInput, Modal,
  TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, useFrameProcessor, useCameraDevices } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { useVideoContext, VideoItem } from '../context/VideoContext';
import Svg, { Line } from 'react-native-svg';
import { detectObjects} from '../utils/detectObjects';
import { ObjectType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { saveVideoToGallery, createVideoThumbnail } from '../utils/gallery';
import { detectCourt } from '../utils/detectCourt';

type RootStackParamList = {
  SessionScreen: undefined;
  // add other screens here if needed
};

const SessionPlayer = () => {
  const cameraRef = useRef<Camera>(null);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [objects, setObjects] = useState<ObjectType[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  let frameNum = 0  // what frame we are on
  const [videoTitle, setVideoTitle] = useState('');
  const [pendingVideoUri, setPendingVideoUri] = useState<string | null>(null);
  const [titleModalVisible, setTitleModalVisible] = useState(false);
  const { addVideo } = useVideoContext();

  const desiredWidth = 1920;
  const desiredHeight = 1080;
  const desiredFps = 30; // You can set to 60 if your device supports it

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

  const handlePositions = useCallback((results: any) => {
    // This runs on the JS thread.
    // You can call setState, navigation, etc. here
    frameNum = frameNum + 1;
    console.log("Session player current frame", frameNum);
    setObjects(results);
  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePositions);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    if (!isRecording) {
      return;
      const resultsCopy: ObjectType[] = [];
      sendToJS(resultsCopy); // Calls JS safely
    }
    else {
        const courtPoints = detectCourt(frame);
        console.log("calling detect court if frame 200 only ", courtPoints);
    
      const results = detectObjects(frame) as unknown as ObjectType[];

      // turn 90 degrees clockwise
      // This is necessary because the camera frame is rotated 90 degrees clockwise
      // and we need to adjust the coordinates accordingly.
      // The frame width and height are swapped in the poseObject.
      const yFactor = dimensions.width / frame.height;
      const xFactor = dimensions.height / frame.width;
      /*
        On iOS and Android, front camera preview is usually mirrored by default.
        */
      // Log frame and dimensions for debugging
      if (__DEV__) {
        console.log('Frame dimensions:', frame.width, frame.height);
        console.log('Screen dimensions:', dimensions.width, dimensions.height);
        console.log('X factor:', xFactor, 'Y factor:', yFactor);
      }

      // Make a new array with scaled x, y, width, height
      const resultsCopy = results.map(obj => ({
        ...obj,
        x: obj.x * xFactor,
        y: obj.y * yFactor
      }));

      console.log('Tennis objects position:', results);
      console.log('Adjusted Tennis objects position:', resultsCopy);
      sendToJS(resultsCopy); // Calls JS safely
    }
  }, [sendToJS]);

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

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
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
    setIsRecording(false);
  }, [isRecording]);

  const handleModalClose = async () => {
    if (!pendingVideoUri) return;
    try {
      const savedUri = await saveVideoToGallery(pendingVideoUri);
      setPendingVideoUri(savedUri);
      const poster = await createVideoThumbnail(pendingVideoUri);
      console.log("Adding now");
      const item : VideoItem = {title: videoTitle, uri: savedUri, poster: poster || '', 
                                stroke: 'session', data: objects};
      addVideo(item);
      setTitleModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('SessionScreen');
    } catch (e) {
      console.error(e)
      Alert.alert('Error', 'Failed to save video to gallery.');
      setTitleModalVisible(false);
      setPendingVideoUri(null);
      navigation.navigate('SessionScreen');
    }
  };

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  controlsOverlay: {
    position: 'absolute',
    bottom: 10,
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
    marginBottom: 0,
  },
});

export default SessionPlayer;
