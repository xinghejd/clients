#import <Foundation/Foundation.h>
#import "commands/status.h"
#import "commands/sync.h"
#import "rust.h"
#import "utils.h"

// Tips for developing Objective-C code:
// - Use the `NSLog` function to log messages to the system log
//   - Example:
//     NSLog(@"An example log: %@", someVariable);
// - Use the `@try` and `@catch` directives to catch exceptions

#if !__has_feature(objc_arc)
  // Auto Reference Counting makes memory management easier for Objective-C objects
  // Regular C objects still need to be managed manually
  #error ARC must be enabled!
#endif

/// Converts an NSString to an ObjCString struct
struct ObjCString nsStringToObjCString(NSString* string) {
  size_t size = [string lengthOfBytesUsingEncoding:NSUTF8StringEncoding] + 1;
  char *value = malloc(size);
  [string getCString:value maxLength:size encoding:NSUTF8StringEncoding];

  struct ObjCString objCString;
  objCString.value = value;
  objCString.size = size;

  return objCString;
}

/// Converts a C-string to an NSString
NSString* cStringToNSString(char* string) {
  return [[NSString alloc] initWithUTF8String:string];
}

/// Frees the memory allocated for an ObjCString
void freeObjCString(struct ObjCString *value) {
  free(value->value);
}

NSDictionary *parseJson(NSString *jsonString, NSError *error) {
  NSData *data = [jsonString dataUsingEncoding:NSUTF8StringEncoding];
  NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data options:0 error:&error];
  if (error) {
    return nil;
  }
  return json;
}

void _return(void* context, NSString *output) {
  commandReturn(context, nsStringToObjCString(output));
}

NSString *internalRunCommand(void* context, NSDictionary *input) {
  _return(context, toSuccess(@{@"message": @"commandReturn from Objective-C"}));
  NSString *command = input[@"command"];

  if ([command isEqual:@"status"]) {
    return status(input);
  } else if ([command isEqual:@"sync"]) {
    return _sync(input);
  }

  return toError([NSString stringWithFormat:@"Unknown command: %@", command]);
}

/// Runs a command with the given input JSON
/// This function is called from Rust and is the entry point for running Objective-C code.
/// It takes a JSON string as input, deserializes it, runs the command, and serializes the output.
/// It also catches any exceptions that occur during the command execution.
struct ObjCString runCommand(void *context, char* inputJson) {
  @autoreleasepool {
    @try {
      NSString *inputString = cStringToNSString(inputJson);

      NSError *error = nil;
      NSDictionary *input = parseJson(inputString, error);
      if (error) {
        NSString *outputString = toError([NSString stringWithFormat:@"Error occured while deserializing input params: %@", error]);
        return nsStringToObjCString(outputString);
      }

      NSString *outputString = internalRunCommand(context, input);
      return nsStringToObjCString(outputString);
    } @catch (NSException *e) {
      NSString *outputString = toError([NSString stringWithFormat:@"Error occurred while running Objective-C command: %@", e]);
      return nsStringToObjCString(outputString);
    }
  }
}
