import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform, Alert } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { request, PERMISSIONS } from 'react-native-permissions';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';

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
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const { addVideo } = useVideoContext();

  const requestGalleryPermission = async () => {
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY
        : PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
    );
    return result;
  };

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await Camera.requestCameraPermission();
      const micStatus = await Camera.requestMicrophonePermission();
      const galleryStatus = await requestGalleryPermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted' &&
        galleryStatus === 'granted'
      );
    })();
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (!cameraRef.current || isRecording) return;
    setIsRecording(true);
    try {
      await cameraRef.current.startRecording({
        onRecordingFinished: async (video) => {
          try {
            await CameraRoll.save(video.path, { type: 'video' });
            addVideo({ id: Date.now().toString(), uri: video.path });
            navigation.goBack();
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

  if (!permissionsGranted) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Camera, microphone, or gallery permissions are required.
        </Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />
      <View style={styles.controlsOverlay}>
        {!isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
            <Icon name="record-circle" size={72} color="red" />
            <Text style={styles.controlText}>Record</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <Icon name="stop-circle" size={72} color="#fff" />
            <Text style={styles.controlText}>Stop</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.stopButton, { position: 'absolute', top: 10, right: 20 }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={36} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black'},
  controlsOverlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stopButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  controlText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 4,
    fontWeight: 'bold',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
});

export default VideoPlayer;