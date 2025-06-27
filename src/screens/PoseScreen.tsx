import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Camera } from '../components/PoseCamera';
import { useCameraDevices } from 'react-native-vision-camera';
import { 
  requestGalleryPermission, 
  requestCameraPermission,
  requestMicrophonePermission
} from '../utils/permissions';

const { width, height } = Dimensions.get('window');

export default function PoseScreen() {
  const [pose, setPose] = useState<any>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      const galleryStatus = await requestGalleryPermission();
      setPermissionsGranted(
        cameraStatus === 'granted' &&
        micStatus === 'granted' &&
        galleryStatus === 'granted'
      );
    })();
  }, []);

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
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        options={{
          mode: 'stream',
          performanceMode: 'max',
        }}
        callback={(data: any) => setPose(data)}
      />
      <View style={styles.overlay}>
        <Text style={styles.poseText}>
          {pose ? JSON.stringify(pose, null, 2) : 'Detecting pose...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
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
});
