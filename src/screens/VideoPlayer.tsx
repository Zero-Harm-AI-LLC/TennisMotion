import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Text, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { createThumbnail } from 'react-native-create-thumbnail';
import { 
  requestGalleryPermission, 
  requestCameraPermission,
  requestMicrophonePermission
} from '../utils/permissions';
import { useFocusEffect } from '@react-navigation/native';
import { useIsFocused } from '@react-navigation/native';

type RootStackParamList = {
  VideoScreen: undefined;
  // add other screens here if needed
};
import { useVideoContext } from '../context/VideoContext';

const VideoPlayer = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');

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

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      //const galleryStatus = await requestGalleryPermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted' 
        // && galleryStatus === 'granted'
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

  // Handle start recording
  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          try {
            const videoUri = video.path.startsWith('file://') ? video.path : `file://${video.path}`;
            await CameraRoll.save(videoUri, { type: 'video' });
            const posterUri = await createVideoThumbnail(videoUri);
            addVideo({ id: Date.now().toString(), uri: videoUri, poster: posterUri || undefined });
          } catch (e) {
            Alert.alert('Error', 'Failed to save video to gallery.');
          }
          setIsRecording(false);
          navigation.navigate('VideoScreen'); // <-- Navigate away after recording
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
});

export default VideoPlayer;