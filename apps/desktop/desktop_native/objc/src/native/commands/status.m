#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import "../interop.h"
#import "status.h"

BOOL autofillEnabled() {
  if (@available(macos 11, *)) {
    ASCredentialIdentityStore *store = [ASCredentialIdentityStore sharedStore];
    __block BOOL enabled = YES;
    [store getCredentialIdentityStoreStateWithCompletion:^(ASCredentialIdentityStoreState * _Nonnull state) {
      enabled = state.enabled;
    }];
    return enabled;
  } else {
    return NO;
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

NSString *status(NSDictionary *params) {
  return _success(@{
    @"support": @{
      @"fido2": @(fido2Supported()),
      @"password": @(passwordSupported())
    },
    @"state": @{
      @"enabled": @(autofillEnabled())
    }
  });
}
