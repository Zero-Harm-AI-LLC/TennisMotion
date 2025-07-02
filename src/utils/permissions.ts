import {
  Alert,
  type PermissionStatus,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {Camera} from 'react-native-vision-camera';
import { request, check, RESULTS, PERMISSIONS } from 'react-native-permissions';

const APP_NAME = 'TennisMotion';

export const requestCameraPermission = async (): Promise<
  PermissionStatus | 'restricted'
> => {
  const cameraPermission = await Camera.getCameraPermissionStatus();
  console.log({cameraPermission});
  if (Platform.OS === 'android') {
    return await requestAndroidCameraPermission();
  }
  if (cameraPermission === 'not-determined') {
    const newCameraPermission = await Camera.requestCameraPermission();
    if (newCameraPermission !== 'granted') {
      Alert.alert('Please go to the settings to enable it!');
    }
    return newCameraPermission;
  }
  return cameraPermission;
};

export const requestGalleryPermission = async () => {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY
      : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

  const result = await check(permission);
  if (result === RESULTS.GRANTED) {
    return result;
  }

  return await request(permission);
};

const requestAndroidCameraPermission =
  async (): Promise<PermissionStatus> => {
    try {
      const checkResult = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (checkResult) {
        console.log('Camera permission already granted');
        return PermissionsAndroid.RESULTS.GRANTED;
      }
      const requestResult = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: `${APP_NAME} Photo App Camera Permission`,
          message: `${APP_NAME} needs access to your camera to scan barcodes.`,
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (requestResult === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Camera permission granted');
      } else {
        console.log('Camera permission denied');
      }
      return requestResult;
    } catch (err) {
      console.warn(err);
      return PermissionsAndroid.RESULTS.DENIED;
    }
  };

export const requestMicrophonePermission = async (): Promise<PermissionStatus> => {
  const micStatus = await Camera.requestMicrophonePermission();
  if (micStatus !== 'granted') {
    Alert.alert(
      'Please go to the settings to enable microphone permission!',
    );
  }
  return micStatus;
}