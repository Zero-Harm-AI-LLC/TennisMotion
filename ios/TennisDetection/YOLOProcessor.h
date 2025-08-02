#import <Foundation/Foundation.h>
#import <CoreML/CoreML.h>

@interface YOLOProcessor : NSObject

+ (NSMutableArray *)processOutput:(MLMultiArray *)confidenceArray
                       coordinates:(MLMultiArray *)coordinatesArray
                       cameraSize:(CGSize)cameraSize
                    modelInputSize:(CGSize)modelInputSize;

@end
