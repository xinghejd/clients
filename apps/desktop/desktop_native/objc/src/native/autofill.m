#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>

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
struct ObjCString nsstring_to_obj_c_string(NSString* string) {
  size_t size = [string lengthOfBytesUsingEncoding:NSUTF8StringEncoding] + 1;
  char *value = malloc(size);
  [string getCString:value maxLength:size encoding:NSUTF8StringEncoding];

  struct ObjCString obj_c_string;
  obj_c_string.value = value;
  obj_c_string.size = size;

  return obj_c_string;
}

/// Converts a C-string to an NSString
NSString* c_string_to_nsstring(char* string) {
  return [[NSString alloc] initWithUTF8String:string];
}

/// Frees the memory allocated for an ObjCString
void free_objc_string(struct ObjCString *value) {
  free(value->value);
}

// struct ObjCString hello_world(char* value)

// void hello_world(char* value, char* output, int output_size)
struct ObjCString hello_world(char* input)
{
  // NSString *inputString = [[NSString alloc] initWithUTF8String:value];
  NSString *inputString = c_string_to_nsstring(input);
  NSLog(@"[BW] Objc from rust, hello: %@", inputString);

  NSString *outputString = @"Hello, World from objc!";
  // [outputString getCString:output maxLength:output_size encoding:NSUTF8StringEncoding];

  if (@available(macos 14, *))
  {
    NSLog(@"[BW] macOS 14 or later - full autofill support including passkeys");

    ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedStore];
    [store getCredentialIdentityStoreStateWithCompletion:^(ASCredentialIdentityStoreState * _Nonnull state) {
      if (!state.enabled)
      {
        NSLog(@"[BW] Autofill is disabled - doing nothing");
      }

    }];
  }
  else if (@available(macos 11, *))
  {
    NSLog(@"[BW] macOS 11 or later - password based autofill support only");
  }
  else {
    NSLog(@"[BW] macOS 10 or earlier - no autofill support");
  }

  return nsstring_to_obj_c_string(outputString);
}
