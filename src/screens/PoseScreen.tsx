import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { runOnJS } from 'react-native-reanimated';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { detectPose } from '../utils/detectPose'; 

const { width, height } = Dimensions.get('window');

const PoseScreen = () => {
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [pose, setPose] = useState(null);
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

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Call your native plugin by name
    const result = detectPose(frame);
    // Use runOnJS to update state in the React context
    // This is necessary because the frame processor runs on a separate thread
    console.log('Pose result:', result);
    //runOnJS(setPose)(result);
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
        videoStabilizationMode="off"
        frameProcessor={frameProcessor}
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

export default PoseScreen;
