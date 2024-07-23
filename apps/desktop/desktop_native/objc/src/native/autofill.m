#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>

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

/// Simple struct to hold a C-string and its length
/// This is used to return strings created in Objective-C to Rust
/// so that Rust can free the memory when it's done with the string
struct ObjCString {
  char* value;
  size_t size;
};

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

struct ObjCString runCommand(char* inputJson) {
  @autoreleasepool {
    @try {
      NSString *inputString = cStringToNSString(inputJson);

      // NSString *outputString = [NSString stringWithFormat:@"{\"added\": %@}", e];
      NSString *outputString = @"{\"added\": 0}";
      return nsStringToObjCString(outputString);
    } @catch (NSException *e) {
      NSString *outputString = [NSString stringWithFormat:@"Error occurred while running Objective-C command: %@", e];
      return nsStringToObjCString(outputString);
    }
  }
}

// // void hello_world(char* value, char* output, int output_size)
// struct ObjCString hello_world(char* input)
// {
//   // NSString *inputString = [[NSString alloc] initWithUTF8String:value];
//   NSString *inputString = cStringToNSString(input);
//   NSLog(@"[BW] Objc from rust, hello: %@", inputString);

//   NSString *outputString = @"Hello, World from objc!";
//   // [outputString getCString:output maxLength:output_size encoding:NSUTF8StringEncoding];

//   if (@available(macos 14, *))
//   {
//     NSLog(@"[BW] macOS 14 or later - full autofill support including passkeys");

//     ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedStore];
//     [store getCredentialIdentityStoreStateWithCompletion:^(ASCredentialIdentityStoreState * _Nonnull state) {
//       if (!state.enabled)
//       {
//         NSLog(@"[BW] Autofill is disabled - doing nothing");
//       }

//     }];
//   }
//   else if (@available(macos 11, *))
//   {
//     NSLog(@"[BW] macOS 11 or later - password based autofill support only");
//   }
//   else {
//     NSLog(@"[BW] macOS 10 or earlier - no autofill support");
//   }

//   return nsStringToObjCString(outputString);
// }
