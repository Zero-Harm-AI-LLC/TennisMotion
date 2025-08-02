#import <Foundation/Foundation.h>
#import <CoreML/CoreML.h>

@interface YOLOv8Processor : NSObject

+ (NSArray<NSDictionary *> *)processOutput:(MLMultiArray *)output
                       confidenceThreshold:(float)threshold;

@end

