#import <Foundation/Foundation.h>
#import <CoreML/CoreML.h>

@interface YOLOv5Processor : NSObject

+ (NSArray<NSDictionary *> *)processOutput:(MLMultiArray *)confidenceArray
                               coordinates:(MLMultiArray *)coordinatesArray;

@end
