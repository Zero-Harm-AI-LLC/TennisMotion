#import "YOLOProcessor.h"
#import <UIKit/UIKit.h>

@implementation YOLOProcessor

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
+ (NSMutableArray *)processOutput:(MLMultiArray *)confidenceArray
                       coordinates:(MLMultiArray *)coordinatesArray
                       cameraSize:(CGSize)cameraSize
                    modelInputSize:(CGSize)modelInputSize {

    NSMutableArray *results = [NSMutableArray array];
    static NSArray *classNames = @[@"player-back", @"player-front", @"tennis-ball"];

    if (confidenceArray.shape.count != 2 || coordinatesArray.shape.count != 2) {
        NSLog(@"Unexpected shape in confidence or coordinates array");
        return results;
    }

    NSInteger boxCount = confidenceArray.shape[0].integerValue;
    NSInteger classCount = confidenceArray.shape[1].integerValue;
    NSInteger coordBoxCount = coordinatesArray.shape[0].integerValue;
    NSInteger coordCount = coordinatesArray.shape[1].integerValue;

    if (boxCount != coordBoxCount || coordCount != 4) {
        NSLog(@"Mismatch between confidence and coordinate dimensions");
        return results;
    }

    if (boxCount == 0) {
        NSLog(@"No detections found.");
        return results;
    }

    CGFloat scaleX = modelInputSize.width / cameraSize.width;
    CGFloat scaleY = modelInputSize.height / cameraSize.height;
    CGFloat scale = MAX(scaleX, scaleY);

    CGFloat scaledWidth = cameraSize.width * scale;
    CGFloat scaledHeight = cameraSize.height * scale;
    CGFloat cropX = (scaledWidth - modelInputSize.width) / 2.0;
    CGFloat cropY = (scaledHeight - modelInputSize.height) / 2.0;

    for (NSInteger i = 0; i < boxCount; i++) {
        float maxConfidence = 0.0;
        NSInteger bestClass = -1;

        for (NSInteger j = 0; j < classCount; j++) {
            NSInteger index = i * classCount + j;
            float confidence = confidenceArray[index].floatValue;
            if (confidence > maxConfidence) {
                maxConfidence = confidence;
                bestClass = j;
            }
        }

        if (bestClass < 0 || bestClass >= classNames.count) continue;

        // Normalized bbox: [x_center, y_center, width, height]
        NSInteger coordBase = i * 4;
        float x_norm = coordinatesArray[coordBase + 0].floatValue;
        float y_norm = coordinatesArray[coordBase + 1].floatValue;
        float w_norm = coordinatesArray[coordBase + 2].floatValue;
        float h_norm = coordinatesArray[coordBase + 3].floatValue;

        // Convert to model input pixels
        float x_model = x_norm * modelInputSize.width;
        float y_model = y_norm * modelInputSize.height;
        float w_model = w_norm * modelInputSize.width;
        float h_model = h_norm * modelInputSize.height;

        // Undo crop and scale to map back to original image coordinates
        float x_cam = (x_model + cropX) / scale;
        float y_cam = (y_model + cropY) / scale;
        float w_cam = w_model / scale;
        float h_cam = h_model / scale;

        CGRect box = CGRectMake(x_cam - w_cam/2.0, y_cam - h_cam/2.0, w_cam, h_cam);

        NSDictionary *detection = @{
            @"class": classNames[bestClass],
            @"confidence": @(maxConfidence),
              @"x": @(x_cam - w_cam/2.0),
              @"y": @(y_cam - h_cam/2.0),
              @"width": @(w_cam),
              @"height": @(h_cam)
        };

        [results addObject:detection];
    }

    // Debug print
    for (NSDictionary *det in results) {
        NSLog(@"Class: %@ | Conf: %.2f | Box: (%.2f, %.2f, %.2f, %.2f)",
              det[@"class"],
              [det[@"confidence"] floatValue],
                [det[@"x"] floatValue],
                [det[@"y"] floatValue],
                [det[@"width"] floatValue],
                [det[@"height"] floatValue]);
    }

    return results;
}
@end
