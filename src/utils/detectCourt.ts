import { VisionCameraProxy, FrameProcessorPlugin, Frame } from 'react-native-vision-camera';

const LINKING_ERROR: string =
  `The native plugin package 'CourtDetection' doesn't seem to be linked. Make sure to rebuild the native code\n`;

const plugin: FrameProcessorPlugin | undefined = VisionCameraProxy.initFrameProcessorPlugin('detectCourt', {});

export function detectCourt(frame: Frame) {
  'worklet'
  if (plugin == null) {
    throw new Error("Failed to load Frame Processor Plugin!")
  }
  return plugin.call(frame)
}
