#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import "../utils.h"
#import "sync.h"

// _ is because the name clashes with internal macOS function
NSString *_sync(NSDictionary *params) {
  return toSuccess(@{
    @"support": @"sync"
  });
}
