#import "YOLOv5Processor.h"
#import <UIKit/UIKit.h>

@implementation YOLOv5Processor

/* From YOLOv5 with nms=True, you typically get:

 confidence: shape (0 × 3) → [class_id, confidence_score, box_id]
 coordinates: shape (0 × 4) → [x, y, w, h] (or [x1, y1, x2, y2])
 The box_id in the confidence output lets you index into the coordinates array
 to get the actual bounding box for the detection.
 
 Used In YOLOv5 NMS Output:
 This format is commonly used for the confidence output of a YOLOv5 model exported with nms=True.

 Each row typically represents a detection:

 [class_id, confidence_score, box_index]
 Index  class_id  confidence  box_index
 0  0.0  0.87  2
 1  2.0  0.65  0
 2  5.0  0.92  1
 class_id: predicted class label index.
 
 Output Name  Shape  Description
 confidence  Float32 0×3  [class_id, confidence, box_index]
 coordinates  Float32 0×4  [x, y, width, height] or [x1, y1, x2, y2]

confidence: model's probability score for that detection.
box_index: row index in the coordinates array (shape: 0 × 4) that gives the bounding box for this detection.
 */
+ (NSArray<NSDictionary *> *)parseOutput:(MLMultiArray *)confidenceArray
                                                coordinates:(MLMultiArray *)coordinatesArray {
    NSMutableArray<NSDictionary *> *results = [NSMutableArray array];

    if (confidenceArray.shape.count != 2 || confidenceArray.shape[1].intValue != 3 ||
        coordinatesArray.shape.count != 2 || coordinatesArray.shape[1].intValue != 4) {
        NSLog(@"Invalid shape: confidence %@, coordinates %@", confidenceArray.shape, coordinatesArray.shape);
        return results;
    }

    NSUInteger numDetections = confidenceArray.shape[0].unsignedIntegerValue;

    for (NSUInteger i = 0; i < numDetections; i++) {
        // Read classId, confidence, and box index
        NSNumber *row = [NSNumber numberWithUnsignedLong:i];
      float classId = [[confidenceArray objectForKeyedSubscript:@[@(i), @0]] floatValue];
      float confidence = [[confidenceArray objectForKeyedSubscript:@[@(i), @1]] floatValue];
      NSUInteger boxIdx = (NSUInteger)[[confidenceArray objectForKeyedSubscript:@[@(i), @2]] floatValue];

        // Validate box index
        if (boxIdx >= coordinatesArray.shape[0].unsignedIntegerValue) continue;

        // Read coordinates
        NSNumber *boxRow = [NSNumber numberWithUnsignedLong:boxIdx];
      float x = [[coordinatesArray objectForKeyedSubscript:@[@(boxIdx), @0]] floatValue];
      float y = [[coordinatesArray objectForKeyedSubscript:@[@(boxIdx), @1]] floatValue];
      float w = [[coordinatesArray objectForKeyedSubscript:@[@(boxIdx), @2]] floatValue];
      float h = [[coordinatesArray objectForKeyedSubscript:@[@(boxIdx), @3]] floatValue];

        // Add detection to results
        NSDictionary *detection = @{
            @"classId": @(classId),
            @"confidence": @(confidence),
            @"x": @(x),
            @"y": @(y),
            @"width": @(w),
            @"height": @(h)
        };

        [results addObject:detection];
    }

    return results;
}

@end
