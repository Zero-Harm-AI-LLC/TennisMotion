#import "YOLOv8Processor.h"
#import <UIKit/UIKit.h>

float IoU(CGRect a, CGRect b) {
    float intersectionX = fmaxf(CGRectGetMinX(a), CGRectGetMinX(b));
    float intersectionY = fmaxf(CGRectGetMinY(a), CGRectGetMinY(b));
    float intersectionWidth = fminf(CGRectGetMaxX(a), CGRectGetMaxX(b)) - intersectionX;
    float intersectionHeight = fminf(CGRectGetMaxY(a), CGRectGetMaxY(b)) - intersectionY;

    if (intersectionWidth <= 0 || intersectionHeight <= 0) return 0.0;

    float intersectionArea = intersectionWidth * intersectionHeight;
    float unionArea = a.size.width * a.size.height + b.size.width * b.size.height - intersectionArea;

    return intersectionArea / unionArea;
}

NSMutableArray<NSDictionary *> *nonMaxSuppression(NSArray<NSDictionary *> *detections, float iouThreshold) {
    NSMutableArray<NSDictionary *> *result = [NSMutableArray array];

    // Sort by confidence descending
    NSArray *sorted = [detections sortedArrayUsingComparator:^NSComparisonResult(NSDictionary *a, NSDictionary *b) {
        float confA = [a[@"confidence"] floatValue];
        float confB = [b[@"confidence"] floatValue];
        return (confA < confB) ? NSOrderedDescending : NSOrderedAscending;
    }];

    NSMutableArray<NSDictionary *> *queue = [sorted mutableCopy];

    while (queue.count > 0) {
        NSDictionary *current = queue[0];
        [result addObject:current];
        [queue removeObjectAtIndex:0];

        CGRect currentBox = [current[@"bbox"] CGRectValue];

        NSMutableArray<NSDictionary *> *remaining = [NSMutableArray array];
        for (NSDictionary *d in queue) {
            CGRect box = [d[@"bbox"] CGRectValue];
            float iou = IoU(currentBox, box);
            if (iou < iouThreshold) {
                [remaining addObject:d];
            }
        }

        queue = remaining;
    }

    return result;
}

@implementation YOLOv8Processor

+ (NSMutableArray<NSDictionary *> *)processOutput:(MLMultiArray *)output
                       confidenceThreshold:(float)threshold {

  NSMutableArray *results = [NSMutableArray array];
  float *data = (float *)output.dataPointer;
  int N = 8400;

  for (int i = 0; i < N; i++) {
      float cx = data[0 * N + i];
      float cy = data[1 * N + i];
      float w  = data[2 * N + i];
      float h  = data[3 * N + i];
      float obj = data[4 * N + i];
      float clsScore = data[5 * N + i];
      float classId = data[6 * N + i];

      float confidence = obj * clsScore;
      if (confidence < threshold) continue;

      CGRect box = CGRectMake(cx - w / 2.0, cy - h / 2.0, w, h);
      NSDictionary *detection = @{
          @"class": @(classId),
          @"confidence": @(confidence),
          @"bbox": [NSValue valueWithCGRect:box]
      };
      [results addObject:detection];
  }
  
  // Apply NMS
  NSMutableArray<NSDictionary *> *finalResults = nonMaxSuppression(results, 0.45);

  return finalResults;
}

@end
