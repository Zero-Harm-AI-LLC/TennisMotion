import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Button, PermissionsAndroid, Platform, Modal, Alert } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Video from 'react-native-video';
import CameraRoll from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';

export default function RecordScreen() {
  const cameraRef = useRef<RNCamera>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Request permissions for Android
  React.useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      }
    })();
  }, []);

  // Save video to Photos/Gallery
  const saveToCameraRoll = async (uri: string) => {
    try {
      await CameraRoll.save(uri, { type: 'video' });
      Alert.alert('Saved', 'Video saved to Photos');
    } catch (e) {
      Alert.alert('Error', 'Failed to save video');
    }
  };

  // Start recording
  const startRecording = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      try {
        const data = await cameraRef.current.recordAsync();
        setIsRecording(false);
        setVideoUri(data.uri);
        await saveToCameraRoll(data.uri);
      } catch (e) {
        setIsRecording(false);
        Alert.alert('Error', 'Recording failed');
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  // Play video from Photos folder
  const handlePlayVideo = async () => {
    if (!videoUri) {
      Alert.alert('No video', 'No video to play');
      return;
    }
    setShowPlayer(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Record</Text>
      <RNCamera
        ref={cameraRef}
        style={styles.preview}
        type={RNCamera.Constants.Type.front}
        captureAudio={true}
      />
      <View style={styles.controls}>
        {!isRecording ? (
          <Button title="Record Video" onPress={startRecording} />
        ) : (
          <Button title="Stop Recording" onPress={stopRecording} color="#d63031" />
        )}
        <View style={{ width: 16 }} />
        <Button
          title="Playback Video"
          onPress={handlePlayVideo}
          disabled={!videoUri}
        />
      </View>
      <Modal
        visible={showPlayer}
        animationType="slide"
        onRequestClose={() => setShowPlayer(false)}
        transparent={true}
      >
        <View style={styles.modalContainer}>
          {videoUri && (
            <Video
              source={{ uri: videoUri }}
              style={styles.videoPlayer}
              controls
              resizeMode="contain"
            />
          )}
          <Button title="Close" onPress={() => setShowPlayer(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00b894',
    marginBottom: 16,
  },
  preview: {
    width: '100%',
    height: 400,
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayer: {
    width: 320,
    height: 480,
    backgroundColor: '#000',
    marginBottom: 16,
  },
});