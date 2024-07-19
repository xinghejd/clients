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

void hello_world(char* value, char* output, int output_size)
{
  NSString *string = [[NSString alloc] initWithUTF8String:value];
  NSLog(@"[BW] Objc from rust, hello: %@", string);

  NSString *outputString = @"Hello, World from objc!";
  [outputString getCString:output maxLength:output_size encoding:NSUTF8StringEncoding];

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
}
