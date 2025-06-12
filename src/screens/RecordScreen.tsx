import React, { useRef, useState } from 'react';
import { View, Button, Text, StyleSheet, Platform, PermissionsAndroid, Modal } from 'react-native';
import { Camera, useCameraDevices, VideoFile } from 'react-native-vision-camera';
import Video from 'react-native-video';

export default function RecordScreen() {
  const cameraRef = useRef<Camera>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const devices = useCameraDevices();
  const device = devices.back;

  React.useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      const micPermission = await Camera.requestMicrophonePermission();
      if (Platform.OS === 'android') {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
      }
    })();
  }, []);

  const startRecording = async () => {
    if (cameraRef.current && device) {
      setIsRecording(true);
      try {
        const video = await cameraRef.current.startRecording({
          onRecordingFinished: (video: VideoFile) => {
            setVideoUri(video.path);
            setIsRecording(false);
          },
          onRecordingError: (error) => {
            console.warn(error);
            setIsRecording(false);
          },
        });
      } catch (e) {
        console.warn(e);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recording</Text>
      <Camera
        ref={cameraRef}
        style={styles.preview}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />
      <View style={styles.controls}>
        {!isRecording ? (
          <Button title="Start Recording" onPress={startRecording} />
        ) : (
          <Button title="Stop Recording" onPress={stopRecording} color="#d63031" />
        )}
      </View>
      {videoUri && (
        <>
          <Text>Video saved at: {videoUri}</Text>
          <Button title="Play Video" onPress={() => setShowPlayer(true)} />
          <Modal
            visible={showPlayer}
            animationType="slide"
            onRequestClose={() => setShowPlayer(false)}
            transparent={true}
          >
            <View style={styles.modalContainer}>
              <Video
                source={{ uri: videoUri }}
                style={styles.videoPlayer}
                controls
                resizeMode="contain"
              />
              <Button title="Close" onPress={() => setShowPlayer(false)} />
            </View>
          </Modal>
        </>
      )}
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