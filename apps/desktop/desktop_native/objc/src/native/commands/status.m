#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import "../interop.h"
#import "status.h"

BOOL autofillEnabled(void (^callback)(BOOL)) {
  if (@available(macos 11, *)) {
    ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedStore];
    [store getCredentialIdentityStoreStateWithCompletion:^(ASCredentialIdentityStoreState * _Nonnull state) {
      callback(state.enabled);
    }];
  } else {
    callback(NO);
  }
}

BOOL fido2Supported() {
  if (@available(macos 14, *)) {
    return YES;
  } else {
    return NO;
  }
}

BOOL passwordSupported() {
  if (@available(macos 11, *)) {
    return YES;
  } else {
    return NO;
  }
}

void status(void* context, NSDictionary *params) {
  autofillEnabled(^(BOOL enabled) {
    _return(context,
      _success(@{
        @"support": @{
          @"fido2": @(fido2Supported()),
          @"password": @(passwordSupported())
        },
        @"state": @{
          @"enabled": @(enabled)
        }
      })
    );
  });
}
