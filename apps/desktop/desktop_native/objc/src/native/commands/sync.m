#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import <AuthenticationServices/ASCredentialServiceIdentifier.h>
#import <AuthenticationServices/ASPasswordCredentialIdentity.h>
#import "../utils.h"
#import "sync.h"

// _ is because the name clashes with internal macOS function
NSString *_sync(NSDictionary *params) {
  NSArray *credentials = params[@"credentials"];

  // Map credentials to ASPasswordCredential objects
  NSMutableArray *passwordCredentials = [NSMutableArray arrayWithCapacity:credentials.count];
  for (NSDictionary *credential in credentials) {
    NSString *cipherId = credential[@"cipherId"];
    NSString *uri = credential[@"uri"];
    NSString *username = credential[@"username"];

    ASCredentialServiceIdentifier *serviceId = [[ASCredentialServiceIdentifier alloc]
      initWithIdentifier:uri type:ASCredentialServiceIdentifierTypeURL];
    ASPasswordCredentialIdentity *credential = [[ASPasswordCredentialIdentity alloc]
      initWithServiceIdentifier:serviceId user:username recordIdentifier:cipherId];

    [passwordCredentials addObject:credential];
  }

  __block NSString *result = nil;
  [ASCredentialIdentityStore.sharedStore saveCredentialIdentities:passwordCredentials
    completion:^(BOOL success, NSError * _Nullable error) {
      if (error) {
        result = toError(error);
      } else {
        result = toSuccess(@{@"added": @([passwordCredentials count])});
      }
    }];

  return result;
}
