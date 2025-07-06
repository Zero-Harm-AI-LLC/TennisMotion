import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { detectPose } from '../utils/detectPose'; 
import { Canvas, Skia, PaintStyle } from "@shopify/react-native-skia";
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const PoseScreen = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const cameraRef = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const pose = useSharedValue(null);
  const isFocused = useIsFocused();

  // Select 16:9 aspect ratio at 1080p resolution (1920x1080)
  const desiredWidth = 1920;
  const desiredHeight = 1080;
  const desiredFps = 30; // You can set to 60 if your device supports it

  // Use useMemo to optimize format selection
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

  // There might be a black screen
  // A fix might be: https://github.com/mrousavy/react-native-vision-camera/issues/2951
  // which needs a patch to the code
  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    // Call your native plugin to detect the Pose
    // Use runOnJS to update state in the React context
    // This is necessary because the frame processor runs on a separate thread
    const result = detectPose(frame);
    pose.value = result;
    console.log('Pose result:', pose.value);
  }, [pose]);

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
      <Canvas style={{ position: 'absolute', width, height }}>
        // ... your skia logic
      </Canvas>
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
