import React, { useEffect, useState, useMemo, useCallback } from 'react';
import 'react-native-reanimated';
import {
  Dimensions,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Camera, useFrameProcessor, useCameraDevices } from 'react-native-vision-camera';
import { requestCameraPermission, requestMicrophonePermission } from '../utils/permissions';
import { useSharedValue } from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { detectTennisObjPos } from '../utils/detectTennisObjPos';
import { TennisObjType } from '../utils/types';
import { Worklets } from 'react-native-worklets-core';

const defaultTennisObjs : TennisObjType = {
  "player-back": { x: 0, y: 0, width: 0, height: 0 },
  "player-front": { x: 0, y: 0, width: 0, height: 0 },
  "tennis-ball": { x: 0, y: 0, width: 0, height: 0 }
};

const desiredWidth = 1920;
const desiredHeight = 1080;
const desiredFps = 30; // You can set to 60 if your device supports it

const SessionPlayer = () => {
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [tennisObjPos, setTennisObjPos] = useState<TennisObjType>(defaultTennisObjs);
  
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

  const handlePositions = useCallback((result: any) => {
    // This runs on the JS thread.
    console.log('Tennis Obj Position:', result);
    // You can call setState, navigation, etc. here
    setTennisObjPos(result);
  }, []);
  const sendToJS = Worklets.createRunOnJS(handlePositions);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const results = detectTennisObjPos(frame);

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
    console.log('Frame dimensions:', frame.width, frame.height);
    console.log('Screen dimensions:', dimensions.width, dimensions.height);
    console.log('X factor:', xFactor, 'Y factor:', yFactor);

    const tennisObjCopy : TennisObjType = { ...defaultTennisObjs };
    const tennisObj = results as unknown as TennisObjType;
    console.log('Tennis objects position:', tennisObj);
    
    Object.keys(tennisObjCopy).forEach((key) => {
      const box = tennisObj[key as keyof TennisObjType];
      if (box) {
        tennisObjCopy[key as keyof TennisObjType] = box;
      }
    })
    
    console.log('Adjusted Tennis objects position:', tennisObjCopy);
    sendToJS(tennisObjCopy); // Calls JS safely
  }, [sendToJS]);

  useEffect(() => {
    (async () => {
      const cameraStatus = await requestCameraPermission();
      const micStatus = await requestMicrophonePermission();
      setPermissionsGranted(
        cameraStatus === 'granted' && micStatus === 'granted'
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
        frameProcessor={frameProcessor}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={permissionsGranted}
        video={true}
        audio={true}
        format={format}
        fps={desiredFps}
        onError={(error) => console.error('Camera error:', error)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  linesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
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
});

export default SessionPlayer;
