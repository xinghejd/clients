#import <Foundation/Foundation.h>
#import "../utils.h"
#import "status.h"

NSString *status(NSDictionary *params) {
  return toSuccess(@{@"status": @"ok"});
}
