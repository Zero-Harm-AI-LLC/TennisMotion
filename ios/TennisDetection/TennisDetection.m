#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <AVFoundation/AVFoundation.h>
#import <CoreImage/CoreImage.h>
#import <CoreVideo/CoreVideo.h>
#import <React/RCTBridgeModule.h>
#import "yolov5.h" // our model
#import "YOLOv5Processor.h"
#import <UIKit/UIKit.h>

@import CoreML;
//#ddefine DEBUG 1
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
  CIImage *image = ConvertAndResizeSampleBufferToCIImage(sampleBuffer, targetSize, false);
  if (!image) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
  
  // Load the model
  NSError *error = nil;
  static yolov5 *model = nil;
  if (!model) {
    model = [[yolov5 alloc] init];
  }
  
  double iouThreshold = 0.7;         // typical YOLO IoU threshold
  double confidenceThreshold = 0.25;  // typical confidence threshold
  
#ifdef DEBUG
  /*
   single image for debugging: https://drive.google.com/uc?export=download&id=1M9HFvFQnnBuZeO-iPxjepc5nH-LUfYyo
   video file for debugging: https://drive.google.com/uc?export=download&id=1Dp7zPc8WXRvCj9tqvsH2vNARmOrFE9hK
   */
  NSString *urlString = @"https://drive.google.com/uc?export=download&id=1M9HFvFQnnBuZeO-iPxjepc5nH-LUfYyo";
  NSURL *url = [NSURL URLWithString:urlString];
  yolov5Input *input = [[yolov5Input alloc] initWithImageAtURL:url iouThreshold:iouThreshold                                                confidenceThreshold:confidenceThreshold error:&error];
#elif CVPIXEL_BUFFER
  CVPixelBufferRef pixelBuffer = CIImageGetCVPixelBufferRef(image, targetSize);
  if (!pixelBuffer) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
  CVPixelBufferLockBaseAddress(pixelBuffer, 0);
  yolov5Input *input = [[yolov5Input alloc] initWithImage:pixelBuffer
                                             iouThreshold:iouThreshold
                                      confidenceThreshold:confidenceThreshold];
#else
  CGImageRef pixelBuffer = CIImageGetCGImageRef(image, targetSize);
  if (!pixelBuffer) {
    NSLog(@"Failed to get pixel buffer");
    return data;
  }
  yolov5Input *input = [[yolov5Input alloc] initWithImageFromCGImage:pixelBuffer iouThreshold:iouThreshold                                                   confidenceThreshold:confidenceThreshold error:&error];
#endif
  
  // Call YOLO predict
  yolov5Output *output = [model predictionFromFeatures:input error:&error];
  if (error) {
    NSLog(@"CoreML Error: %@", error.localizedDescription);
  } else {
    NSLog(@"Prediction: %@", output);
    
    data = [YOLOv5Processor processOutput:output.confidence coordinates:output.coordinates];
    
    for (NSMutableArray *detection in data) {
      NSLog(@"detection: %@", detection);
    }
  }
#ifdef DEBUG
#elif CVPIXEL_BUFFER
  CVPixelBufferUnlockBaseAddress(pixelBuffer, 0);
  CVPixelBufferRelease(pixelBuffer); // release memory when done
#else
  CGImageRelease(pixelBuffer);
#endif
  return data;
}

VISION_EXPORT_FRAME_PROCESSOR(TennisDetectionPlugin, detectTennisObjects)

@end
