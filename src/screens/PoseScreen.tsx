import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Dimensions } from 'react-native';
import { Camera, useCameraDevices, useFrameProcessor, useSkiaFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-reanimated';
import { requestGalleryPermission, requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { detectPose } from '../utils/detectPose'; 
import { Skia, PaintStyle } from "@shopify/react-native-skia";

const { width, height } = Dimensions.get('window');

const PoseScreen = () => {
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const pose = useSharedValue(null);
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

  // There might be a black screen
  // A fix might be: https://github.com/mrousavy/react-native-vision-camera/issues/2951
  // which needs a patch to the code
  const frameProcessor = useSkiaFrameProcessor((frame) => {
    'worklet';
    // render the video frame
    console.log('Rendering frame: ', frame.width);
    console.log('Rendering frame: ', frame.height);
    frame.render();

    const paint = Skia.Paint();
    paint.setColor(Skia.Color("#FF0000")); // red overlay
    paint.setStyle(PaintStyle.Fill);

    // Draw a red rectangle on top
    frame.drawRect({ x: 0, y: 0, width: frame.width, height: frame.height }, paint);

    // Call your native plugin to detect the Pose
    const result = detectPose(frame);
    // Use runOnJS to update state in the React context
    // This is necessary because the frame processor runs on a separate thread
    pose.value = result;
    console.log('Pose result:', pose.value);
    
    // Use Skia to draw the pose, see https://react-native-vision-camera.com/docs/guides/skia-frame-processors

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
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      <View style={styles.overlay}>
        <Text style={styles.poseText}>
          {pose.value ? JSON.stringify(pose.value, null, 2) : 'Detecting pose...'}
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
