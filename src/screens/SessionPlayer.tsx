import React, { useEffect,useRef, useState, useMemo, useCallback } from 'react';
import 'react-native-reanimated';
import { View, Text, SafeAreaView, TextInput, Modal,
  TouchableOpacity, StyleSheet, Alert, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Camera, useFrameProcessor, useCameraDevices } from 'react-native-vision-camera';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { createThumbnail } from 'react-native-create-thumbnail';
import { useVideoContext, VideoItem } from '../context/VideoContext';
import Svg, { Line } from 'react-native-svg';
import { detectObjects} from '../utils/detectObjects';
import { ObjectType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import RNFS from 'react-native-fs';

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
    setObjects(results);
  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePositions);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    if (!isRecording) {
      const resultsCopy: ObjectType[] = [];
      sendToJS(resultsCopy); // Calls JS safely
    }
    else {
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

  const storeThumbnailLocally = async (tempThumbnailPath: string) => {
    const fileName = `thumb_${Date.now()}.jpg`;
    const newPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    try {
      await RNFS.moveFile(tempThumbnailPath.replace('file://', ''), newPath);
      console.log('Thumbnail saved at:', newPath);
      return `file://${newPath}`;
    } catch (err) {
      console.error('Failed to move thumbnail:', err);
      return null;
    }
  };

  // Create thumbnail for the video
  const createVideoThumbnail = async (videoUri: string) => {    
    try {
      const thumbnail = await createThumbnail({url: videoUri, timeStamp: 1000});
      // Save in app storage
      const savedPath = await storeThumbnailLocally(thumbnail.path);
      return savedPath;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return null;
    }
  }

  async function saveVideoToGallery(videoUri: string): Promise<string> {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) {
      console.warn('No permission to save video.');
      return videoUri;
    }
    try {
      const savedUri = await CameraRoll.save(videoUri, { type: 'video' });
      setPendingVideoUri(savedUri);
      return savedUri; // This is the permanent URI (e.g., ph://... or content://...)
    } catch (error) {
      console.error('Failed to save video to gallery:', error);
      throw error; // Let the caller handle the error
    }
  }

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
  }, [isRecording]);

  const handleModalClose = async () => {
    if (!pendingVideoUri) return;
    try {
      const savedUri = await saveVideoToGallery(pendingVideoUri);
      const posterUri = await createVideoThumbnail(pendingVideoUri);
      console.log("Adding now");
      const item : VideoItem = {title: videoTitle, uri: savedUri, poster: posterUri || '', 
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
