
export type PoseType = {
  leftShoulderPosition: {x: number, y: number},
  rightShoulderPosition: {x: number, y: number},
  leftElbowPosition: {x: number, y: number},
  rightElbowPosition: {x: number, y: number},
  leftWristPosition: {x: number, y: number},
  rightWristPosition: {x: number, y: number},
  leftHipPosition: {x: number, y: number},
  rightHipPosition: {x: number, y: number},
  leftKneePosition: {x: number, y: number},
  rightKneePosition: {x: number, y: number},
  leftAnklePosition: {x: number, y: number},
  rightAnklePosition: {x: number, y: number},
  leftPinkyPosition: {x: number, y: number},
  rightPinkyPosition: {x: number, y: number},
  leftIndexPosition: {x: number, y: number},
  rightIndexPosition: {x: number, y: number},
  leftThumbPosition: {x: number, y: number},
  rightThumbPosition: {x: number, y: number},
  leftHeelPosition: {x: number, y: number},
  rightHeelPosition: {x: number, y: number},
  nosePosition: {x: number, y: number},
  leftFootIndexPosition: {x: number, y: number},
  rightFootIndexPosition: {x: number, y: number},
  leftEyeInnerPosition: {x: number, y: number},
  rightEyeInnerPosition: {x: number, y: number},
  leftEyePosition: {x: number, y: number},
  rightEyePosition: {x: number, y: number},
  leftEyeOuterPosition: {x: number, y: number},
  rightEyeOuterPosition: {x: number, y: number},
  leftEarPosition: {x: number, y: number},
  rightEarPosition: {x: number, y: number},
  leftMouthPosition: {x: number, y: number},
  rightMouthPosition: {x: number, y: number},
};

export interface PoseDetectionOptions {
  // @default stream
  mode?: 'stream' | 'single';
  // @default min
  performanceMode?: 'min' | 'max';
}