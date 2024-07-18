#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>

void hello_world(char* value, char* output, int output_size)
{
  NSString *string = [[NSString alloc] initWithUTF8String:value];
  NSLog(@"[BW] Objc from rust, hello: %@", string);

  NSString *outputString = @"Hello, World from objc!";
  [outputString getCString:output maxLength:output_size encoding:NSUTF8StringEncoding];

  if (@available(macos 11, *)) {
    NSLog(@"[BW] macOS 11 or later");

    ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedStore];
    [store getCredentialIdentityStoreStateWithCompletion:^(ASCredentialIdentityStoreState * _Nonnull state) {
        NSLog(@"[BW] state: %@", state);
        if (state.enabled) {
          NSLog(@"[BW] ASCredentialIdentityStore enabled");
        } else {
          NSLog(@"[BW] ASCredentialIdentityStore disabled");
        }
    }];
  } else {
      NSLog(@"[BW] earlier than macOS 11");
  }
}
