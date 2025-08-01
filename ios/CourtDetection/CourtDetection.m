#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import "keypoints.h" // our model

@interface CourtDetectionPlugin : FrameProcessorPlugin
@end

@implementation CourtDetectionPlugin

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments {
  CMSampleBufferRef buffer = frame.buffer;
  UIImageOrientation orientation = frame.orientation;
  // code goes here
  return nil;
}

VISION_EXPORT_FRAME_PROCESSOR(CourtDetectionPlugin, detectCourt)

@end
