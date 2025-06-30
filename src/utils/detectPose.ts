import type { PoseDetectionOptions } from './types';
import { VisionCameraProxy, FrameProcessorPlugin, Frame } from 'react-native-vision-camera';

const LINKING_ERROR: string =
  `The native plugin package 'PoseDetection' doesn't seem to be linked. Make sure to rebuild the native code\n`;

const poseOptions : PoseDetectionOptions = {
  mode: 'stream', // or 'single'
  performanceMode: 'max', // or 'min'
};

const plugin: FrameProcessorPlugin | undefined =
  VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});

export function detectPose(frame: Frame): any {
  'worklet';
  if (plugin == null) throw new Error(LINKING_ERROR);
  // @ts-ignore
  return plugin.call(frame, poseOptions);
}