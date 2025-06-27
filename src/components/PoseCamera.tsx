import React, { forwardRef,type ForwardedRef } from 'react';
import {
  Camera as VisionCamera,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { detectPose } from '../utils/detectPose';
import type { CameraTypes, Frame, PoseType, FrameProcessor } from '../utils/types';

export const Camera = forwardRef(function Camera(props: CameraTypes,ref:ForwardedRef<any>) {
  const { callback, device, options } = props;
  // @ts-ignore
  const useWorklets = useRunOnJS((data: PoseType): void => {
    callback(data);
  }, []);
  const frameProcessor: FrameProcessor = useFrameProcessor(
    (frame: Frame): void => {
      'worklet';
      const data: PoseType = detectPose(frame, options);
      // @ts-ignore
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useWorklets(data);
    },
    []
  );
  return (
    !!device && <VisionCamera ref={ref} frameProcessor={frameProcessor} {...props} />
  );
});
