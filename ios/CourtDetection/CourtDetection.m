#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import "keypoints.h" // our model

@interface CourtDetectionPlugin : FrameProcessorPlugin
@end

MLMultiArray* ConvertSampleBufferToInput(CMSampleBufferRef sampleBuffer) {
    // 1. Get CVPixelBuffer from CMSampleBuffer
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
    if (!pixelBuffer) return nil;

    // 2. Resize and convert to CIImage
    CIImage *ciImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];

    // 3. Resize to 224x224 (ResNet50 input size)
    CIContext *ciContext = [CIContext context];
    CGRect targetRect = CGRectMake(0, 0, 224, 224);
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();

    CVPixelBufferRef resizedBuffer = NULL;
    NSDictionary *pixelBufferAttributes = @{
        (NSString *)kCVPixelBufferCGImageCompatibilityKey: @YES,
        (NSString *)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
    };

    CVPixelBufferCreate(kCFAllocatorDefault, 224, 224, kCVPixelFormatType_32BGRA,
                        (__bridge CFDictionaryRef)pixelBufferAttributes, &resizedBuffer);
    
    [ciContext render:[ciImage imageByCroppingToRect:ciImage.extent]
         toCVPixelBuffer:resizedBuffer
         bounds:targetRect
         colorSpace:colorSpace];

    CFRelease(colorSpace);

    // 4. Lock base address and extract pixel data
    CVPixelBufferLockBaseAddress(resizedBuffer, kCVPixelBufferLock_ReadOnly);
    size_t width = CVPixelBufferGetWidth(resizedBuffer);
    size_t height = CVPixelBufferGetHeight(resizedBuffer);
    size_t bytesPerRow = CVPixelBufferGetBytesPerRow(resizedBuffer);
    uint8_t *baseAddress = (uint8_t *)CVPixelBufferGetBaseAddress(resizedBuffer);

    // 5. Allocate MLMultiArray (Float32 1x3x224x224)
    NSError *error = nil;
    MLMultiArray *multiArray = [[MLMultiArray alloc] initWithShape:@[@1, @3, @224, @224]
                                                          dataType:MLMultiArrayDataTypeFloat32
                                                             error:&error];
    if (error) {
        NSLog(@"Failed to allocate MLMultiArray: %@", error);
        CVPixelBufferUnlockBaseAddress(resizedBuffer, kCVPixelBufferLock_ReadOnly);
        return nil;
    }

    // 6. Fill MLMultiArray with normalized RGB data
    float *arrayData = (float *)multiArray.dataPointer;

    for (int y = 0; y < height; y++) {
        uint8_t *row = baseAddress + y * bytesPerRow;
        for (int x = 0; x < width; x++) {
            uint8_t *pixel = row + x * 4; // BGRA

            float r = pixel[2] / 255.0; // Red
            float g = pixel[1] / 255.0; // Green
            float b = pixel[0] / 255.0; // Blue

            int indexR = 0 * 224 * 224 + y * 224 + x;
            int indexG = 1 * 224 * 224 + y * 224 + x;
            int indexB = 2 * 224 * 224 + y * 224 + x;

            arrayData[indexR] = r;
            arrayData[indexG] = g;
            arrayData[indexB] = b;
        }
    }

    CVPixelBufferUnlockBaseAddress(resizedBuffer, kCVPixelBufferLock_ReadOnly);
    CVPixelBufferRelease(resizedBuffer);

    return multiArray;
}

NSMutableArray<NSValue *> *runModelOnFrame(CMSampleBufferRef sampleBuffer) {
    MLMultiArray *inputArray = ConvertSampleBufferToInput(sampleBuffer); // defined earlier
    if (!inputArray) {
        NSLog(@"Failed to convert sample buffer to MLMultiArray");
        return nil;
    }

    NSError *error = nil;
    keypoints *model = [[keypoints alloc] init];

    keypointsOutput *output = [model predictionFromX_1:inputArray error:&error];
    if (error || !output) {
        NSLog(@"Prediction failed: %@", error.localizedDescription);
        return nil;
    }

    MLMultiArray *resultArray = output.var_802;
    
    // Access the result
    NSMutableArray<NSValue *> *keypoints = [NSMutableArray array];
    for (int i = 0; i < resultArray.count; i += 2) {
        float x = [resultArray[i] floatValue];
        float y = [resultArray[i + 1] floatValue];
        [keypoints addObject:[NSValue valueWithCGPoint:CGPointMake(x, y)]];
    }

    // Now keypoints contains all the (x, y) pairs
    NSLog(@"Detected keypoints: %@", keypoints);
    return keypoints;
}

@implementation CourtDetectionPlugin

- (instancetype _Nonnull)initWithProxy:(VisionCameraProxyHolder*)proxy
                           withOptions:(NSDictionary* _Nullable)options {
  self = [super initWithProxy:proxy withOptions:options];
  return self;
}

- (id _Nullable)callback:(Frame* _Nonnull)frame
           withArguments:(NSDictionary* _Nullable)arguments {
  
  CMSampleBufferRef buffer = frame.buffer;
  
  NSMutableArray *data = [[NSMutableArray alloc] init];
  
  NSMutableArray<NSValue *> *keypoints = runModelOnFrame(buffer);
  for (NSValue *value in keypoints) {
      CGPoint point = [value CGPointValue];
      NSArray *pointArray = @[@(point.x), @(point.y)];
      [data addObject:pointArray];
  }
  
  return data;
}

VISION_EXPORT_FRAME_PROCESSOR(CourtDetectionPlugin, detectCourt)

@end
