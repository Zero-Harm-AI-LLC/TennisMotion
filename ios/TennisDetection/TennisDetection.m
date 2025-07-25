#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <React/RCTBridgeModule.h>

@interface TennisDetectionPlugin : FrameProcessorPlugin
@end

@implementation TennisDetectionPlugin

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}


- (id _Nullable)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments {

    CMSampleBufferRef buffer = frame.buffer;
    UIImageOrientation orientation = frame.orientation;

    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];
    data[@"backPlayer"] = @{@"x": @(0.0), @"y": @(0.0), @"width": @(20.0), @"height": @(20.0)};
    data[@"frontPlayer"] = @{@"x": @(100.0), @"y": @(100.0), @"width": @(20.0), @"height": @(20.0)};
    data[@"ball"] = @{@"x": @(200.0), @"y": @(200.0), @"width": @(10.0), @"height": @(10.0)};
    return data;
}


VISION_EXPORT_FRAME_PROCESSOR(TennisDetectionPlugin, detectTennisObjects)

@end
