
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
};

export interface PoseDetectionOptions {
  // @default stream
  mode?: 'stream' | 'single';
  // @default min
  performanceMode?: 'min' | 'max';
}