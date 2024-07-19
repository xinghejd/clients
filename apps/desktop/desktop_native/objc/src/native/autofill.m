#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>

// Struct MAC String {
//  char* value;
//  int length;
// }

// void free MAC String(MAC String* string) {
//  free(string->value);
// }

// check https://barhamon.com/post/rust_and_nsstring.html

/// Simple struct to hold a C-string and its length
/// This is used to return strings created in Objective-C to Rust
/// so that Rust can free the memory when it's done with the string
struct ObjCString {
  char* value;
  size_t size;
};

struct ObjCString nsstring_to_obj_c_string(NSString* string) {
  size_t size = [string lengthOfBytesUsingEncoding:NSUTF8StringEncoding] + 1;
  char *value = malloc(size);
  [string getCString:value maxLength:size encoding:NSUTF8StringEncoding];

  struct ObjCString obj_c_string;
  obj_c_string.value = value;
  obj_c_string.size = size;

  return obj_c_string;
}

void free_objc_string(struct ObjCString *value) {
  free(value->value);
}

// void hello_world(char* value, char* output, int output_size)
struct ObjCString hello_world(char* value)
{
  NSString *inputString = [[NSString alloc] initWithUTF8String:value];
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

  [inputString dealloc];

  return nsstring_to_obj_c_string(outputString);
}
