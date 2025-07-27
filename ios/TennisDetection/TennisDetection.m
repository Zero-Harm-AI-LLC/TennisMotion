#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <React/RCTBridgeModule.h>
#import "yolov5.h" // our model
#import "YOLOv5Processor.h"

@import CoreML;

@interface TennisDetectionPlugin : FrameProcessorPlugin

@end

//CIContext *__ciContext;
//yolov5 *__model;

CVPixelBufferRef ConvertAndResizeSampleBufferForCoreML(CMSampleBufferRef sampleBuffer,
                                                       CGSize targetSize,
                                                       CIContext *ciContext) {
    CVPixelBufferRef inputBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (!inputBuffer) return nil;

    CIImage *ciImage = [CIImage imageWithCVPixelBuffer:inputBuffer];

    // Scale the image to the target size
    CGFloat scaleX = targetSize.width / ciImage.extent.size.width;
    CGFloat scaleY = targetSize.height / ciImage.extent.size.height;
    CGFloat scale = MIN(scaleX, scaleY); // Maintain aspect ratio

    CIImage *resizedImage = [ciImage imageByApplyingTransform:CGAffineTransformMakeScale(scale, scale)];
    resizedImage = [resizedImage imageByCroppingToRect:CGRectMake(0, 0, targetSize.width, targetSize.height)];

    // Create output buffer
    CVPixelBufferRef outputBuffer = NULL;
    NSDictionary *attributes = @{
        (NSString *)kCVPixelBufferPixelFormatTypeKey: @(kCVPixelFormatType_32BGRA),
        (NSString *)kCVPixelBufferWidthKey: @(targetSize.width),
        (NSString *)kCVPixelBufferHeightKey: @(targetSize.height),
        (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
        (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
    };

    CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault,
                                          targetSize.width,
                                          targetSize.height,
                                          kCVPixelFormatType_32BGRA,
                                          (__bridge CFDictionaryRef)attributes,
                                          &outputBuffer);
  if (status != kCVReturnSuccess) {
    NSLog(@"Failed to create pixel buffer");
    return nil;
  }

    // Render resized image into output buffer
    [ciContext render:resizedImage toCVPixelBuffer:outputBuffer];

    return outputBuffer;
}

@implementation TennisDetectionPlugin

CIContext *__ciContext;
yolov5 *__model;

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  __ciContext = [CIContext contextWithOptions:nil];

  return self;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments {

    NSMutableDictionary *data = [[NSMutableDictionary alloc] init];

    CMSampleBufferRef sampleBuffer = frame.buffer;
  
    // Apply a color transform if needed (e.g., kCIYpCbCrToRGBA)
    // This implicitly handles the YUV to RGB conversion
    if (!__ciContext) {
      __ciContext = [CIContext contextWithOptions:nil];
    }

    CGSize targetSize = { 640, 640 };
    CVPixelBufferRef pixelBuffer = ConvertAndResizeSampleBufferForCoreML(sampleBuffer, targetSize, __ciContext);
    if (!pixelBuffer) {
        NSLog(@"Failed to get pixel buffer");
        return data;
    }

    // (Optional) Lock base address if you need to access raw pixels
    CVPixelBufferLockBaseAddress(pixelBuffer, 0);

    // Load the model
    NSError *error = nil;
    if (!__model) {
      __model = [[yolov5 alloc] init];
    }
    double iouThreshold = 0.45;         // typical YOLO IoU threshold
    double confidenceThreshold = 0.25;  // typical confidence threshold
    yolov5Input *input = [[yolov5Input alloc] initWithImage:pixelBuffer
                                               iouThreshold:iouThreshold
                                        confidenceThreshold:confidenceThreshold];

    yolov5Output *output = [__model predictionFromFeatures:input error:&error];
    if (error) {
        NSLog(@"CoreML Error: %@", error.localizedDescription);
    } else {
      NSLog(@"Prediction: %@", output);
      
      NSArray<NSDictionary *> *detections = [YOLOv5Processor processOutput:output.confidence coordinates:output.coordinates];
      
      for (NSDictionary *detection in detections) {
        CGRect box = [detection[@"rect"] CGRectValue];
        float confidence = [detection[@"confidence"] floatValue];
        int classIndex = [detection[@"classIndex"] intValue];
        
        NSLog(@"Box: %@ | Confidence: %.2f | Class: %d", NSStringFromCGRect(box), confidence, classIndex);
      }
    }

    CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
    CVPixelBufferRelease(pixelBuffer); // release memory when done
  
    data[@"backPlayer"] = @{@"x": @(0.0), @"y": @(0.0), @"width": @(20.0), @"height": @(20.0)};
    data[@"frontPlayer"] = @{@"x": @(100.0), @"y": @(100.0), @"width": @(20.0), @"height": @(20.0)};
    data[@"ball"] = @{@"x": @(200.0), @"y": @(200.0), @"width": @(10.0), @"height": @(10.0)};
    return data;
}


VISION_EXPORT_FRAME_PROCESSOR(TennisDetectionPlugin, detectTennisObjects)

@end
