#import "YOLOv8Processor.h"
#import <UIKit/UIKit.h>

@implementation YOLOv8Processor

+ (NSArray<NSDictionary *> *)processOutput:(MLMultiArray *)output
                       confidenceThreshold:(float)threshold {

    NSMutableArray<NSDictionary *> *results = [NSMutableArray array];

    // Expecting shape [1, 7, 8400]
    if (output.shape.count != 3 ||
        [output.shape[0] intValue] != 1 ||
        [output.shape[1] intValue] != 7) {
        NSLog(@"Unexpected shape: %@", output.shape);
        return results;
    }

    NSInteger numChannels = [output.shape[1] intValue]; // 7
    NSInteger numBoxes = [output.shape[2] intValue];    // 8400

    float *data = (float *)output.dataPointer;

    for (int i = 0; i < numBoxes; i++) {
        NSInteger offset = i;

        float x        = data[0 * numBoxes + offset];
        float y        = data[1 * numBoxes + offset];
        float w        = data[2 * numBoxes + offset];
        float h        = data[3 * numBoxes + offset];
        float objScore = data[4 * numBoxes + offset];
        float cls0     = data[5 * numBoxes + offset];
        float cls1     = data[6 * numBoxes + offset];

        float classScores[2] = {cls0, cls1};
        int bestClass = (cls1 > cls0) ? 1 : 0;
        float classConf = classScores[bestClass];
        float finalScore = objScore * classConf;

        if (finalScore < threshold) continue;

        float rectX = x - w / 2.0f;
        float rectY = y - h / 2.0f;
        CGRect rect = CGRectMake(rectX, rectY, w, h);

        [results addObject:@{
            @"rect": [NSValue valueWithCGRect:rect],
            @"confidence": @(finalScore),
            @"classIndex": @(bestClass)
        }];
    }

    return results;
}

@end
