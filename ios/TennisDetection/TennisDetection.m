#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>
#import <CoreVideo/CoreVideo.h>
#import <React/RCTBridgeModule.h>
#import "YOLOProcessor.h"
#import <UIKit/UIKit.h>

#define YOLOV5
#define CGIIMAGE

#ifdef YOLOV5
#import "yolov5_nms.h"
#else
#import "yolov8_nms.h" // our model
#endif


@import CoreML;
@interface TennisDetectionPlugin : FrameProcessorPlugin

@end

CIImage *ConvertAndResizeSampleBufferToCIImage(CMSampleBufferRef sampleBuffer,
                                               CGSize targetSize,
                                               BOOL cropToFill) {
  CVPixelBufferRef inputBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  if (!inputBuffer) return nil;
  
  CIImage *inputImage = [CIImage imageWithCVPixelBuffer:inputBuffer];
  if (!inputImage) return nil;
  
  CGFloat inputWidth = CVPixelBufferGetWidth(inputBuffer);
  CGFloat inputHeight = CVPixelBufferGetHeight(inputBuffer);
  CGFloat targetWidth = targetSize.width;
  CGFloat targetHeight = targetSize.height;
  
  CGFloat scaleX = targetWidth / inputWidth;
  CGFloat scaleY = targetHeight / inputHeight;
  CGFloat scale = cropToFill ? MAX(scaleX, scaleY) : MIN(scaleX, scaleY);
  
  CGFloat scaledWidth = inputWidth * scale;
  CGFloat scaledHeight = inputHeight * scale;
  
  // Compute translation to center image
  CGFloat xOffset = (targetWidth - scaledWidth) / 2.0;
  CGFloat yOffset = (targetHeight - scaledHeight) / 2.0;
  
  CGAffineTransform scaleTransform = CGAffineTransformMakeScale(scale, scale);
  CGAffineTransform translateTransform = CGAffineTransformMakeTranslation(xOffset, yOffset);
  CIImage *scaledImage = [[inputImage imageByApplyingTransform:scaleTransform]
                          imageByApplyingTransform:translateTransform];
  
  return scaledImage;
}

#ifdef CGIIMAGE
CGImageRef CIImageGetCGImageRef(CIImage *scaledImage,
                                CGSize targetSize) {
  // Render with CIContext
  static CIContext *ciContext = nil;
  if (!ciContext) {
    ciContext = [CIContext contextWithOptions:nil];
  }
  
  CGImageRef cgImage = [ciContext createCGImage:scaledImage
                                       fromRect:CGRectMake(0, 0, targetSize.width, targetSize.height)];
  
  return cgImage; // Call CGImageRelease() when done
}
#else
CVPixelBufferRef CIImageGetCVPixelBufferRef(CIImage *scaledImage,
                                            CGSize targetSize) {
  // Create output pixel buffer
  NSDictionary *attributes = @{
    (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
    (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES,
  };
  CVPixelBufferRef outputBuffer = NULL;
  CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault,
                                        targetSize.width,
                                        targetSize.height,
                                        kCVPixelFormatType_32BGRA,
                                        (__bridge CFDictionaryRef)attributes,
                                        &outputBuffer);
  
  if (status != kCVReturnSuccess) {
    return nil;
  }
  
  // Render using CIContext
  static CIContext *context = nil;
  if (!context) {
    context = [CIContext contextWithOptions:nil];
  }
  
  CVPixelBufferLockBaseAddress(outputBuffer, 0);
  [context render:scaledImage toCVPixelBuffer:outputBuffer];
  CVPixelBufferUnlockBaseAddress(outputBuffer, 0);
  
  return outputBuffer;
}
#endif

@implementation TennisDetectionPlugin

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments {
  
  NSMutableArray *data = [[NSMutableArray alloc] init];
  
  CMSampleBufferRef sampleBuffer = frame.buffer;
  
  CGSize targetSize = { 640, 640 };
  BOOL cropToFill = YES; // whether to crop or fit the image
  CIImage *image = ConvertAndResizeSampleBufferToCIImage(sampleBuffer, targetSize, cropToFill);
  if (!image) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
  
  // Load the model
#ifdef YOLOV5
  static yolov5_nms *model = nil;
  if (!model) {
    model = [[yolov5_nms alloc] init];
  }
#else
  static yolov8_nms *model = nil;
  if (!model) {
    model = [[yolov8_nms alloc] init];
  }
#endif
  
  double iouThreshold = 0.7;         // typical YOLO IoU threshold
  double confidenceThreshold = 0.25;  // typical confidence threshold
#ifdef CGIIMAGE
  CGImageRef pixelBuffer = CIImageGetCGImageRef(image, targetSize);
  if (!pixelBuffer) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
#else
  CVPixelBufferRef pixelBuffer = CIImageGetCVPixelBufferRef(image, targetSize);
  if (!pixelBuffer) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
#endif
  // Prepare input for YOLO model
  // Note: yolov5_nmsInput and yolov8_nmsInput are assumed to be the input classes for the respective models
  // Adjust the class names and initializers based on your actual model implementation
  NSError *error = nil;
#ifdef YOLOV5
#ifdef CGIIMAGE
  yolov5_nmsInput *input = [[yolov5_nmsInput alloc] initWithImageFromCGImage:pixelBuffer 
                                          iouThreshold:iouThreshold
                                          confidenceThreshold:confidenceThreshold error:&error];
#else
  yolov5_nmsInput *input = [[yolov5_nmsInput alloc] initWithImage:pixelBuffer
                                          iouThreshold:iouThreshold
                                          confidenceThreshold:confidenceThreshold];
#endif
#else
#ifdef CGIIMAGE
  yolov8_nmsInput *input = [[yolov8_nmsInput alloc] initWithImageFromCGImage:pixelBuffer 
                                          iouThreshold:iouThreshold
                                          confidenceThreshold:confidenceThreshold error:&error];
#else
  yolov8_nmsInput *input = [[yolov8_nmsInput alloc] initWithImage:pixelBuffer
                                          iouThreshold:iouThreshold
                                          confidenceThreshold:confidenceThreshold];
#endif
#endif
  if (error) {
    NSLog(@"CoreML Error: %@", error.localizedDescription);
    return data;
  }
  // Call YOLO predict
#ifdef YOLOV5
  yolov5_nmsOutput *output = [model predictionFromFeatures:input error:&error];
#else
  yolov8_nmsOutput *output = [model predictionFromFeatures:input error:&error];
#endif
    
  CGSize cameraSize = CGSizeMake(frame.width, frame.height);
  CGSize modelInputSize = CGSizeMake(640, 640);

  data = [YOLOProcessor processOutput:output.confidence
                                      coordinates:output.coordinates
                                      cameraSize:cameraSize
                                      modelInputSize:modelInputSize];

  for (NSMutableArray *detection in data) {
    NSLog(@"detection: %@", detection);
  }

// Clean up
#ifdef CGIIMAGE
  CGImageRelease(pixelBuffer);
#else
  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
  CVPixelBufferRelease(pixelBuffer); // release memory when done
#endif

  return data;
}

VISION_EXPORT_FRAME_PROCESSOR(TennisDetectionPlugin, detectTennisObjects)

@end
