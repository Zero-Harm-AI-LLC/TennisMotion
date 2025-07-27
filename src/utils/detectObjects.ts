import { VisionCameraProxy, FrameProcessorPlugin, Frame } from 'react-native-vision-camera';

const LINKING_ERROR: string =
  `The native plugin package 'TennisDetection' doesn't seem to be linked. Make sure to rebuild the native code\n`;

const plugin: FrameProcessorPlugin | undefined = VisionCameraProxy.initFrameProcessorPlugin('detectTennisObjects', {});

export function detectObjects(frame: Frame) {
  'worklet'
  if (plugin == null) {
    throw new Error("Failed to load Frame Processor Plugin!")
  }
  return plugin.call(frame)
}