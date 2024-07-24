#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import <AuthenticationServices/ASCredentialServiceIdentifier.h>
#import <AuthenticationServices/ASPasswordCredentialIdentity.h>
#import "../interop.h"
#import "sync.h"

// 'run' is because the name clashes with internal macOS function
NSString *runSync(NSDictionary *params) {
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
        result = _error(error);
      } else {
        result = _success(@{@"added": @([passwordCredentials count])});
      }
    }];

  return result;
}
