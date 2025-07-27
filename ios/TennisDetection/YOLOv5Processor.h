#import <Foundation/Foundation.h>
#import <CoreML/CoreML.h>

@interface YOLOv5Processor : NSObject

+ (NSMutableArray *)processOutput:(MLMultiArray *)confidenceArray
                               coordinates:(MLMultiArray *)coordinatesArray;

@end
