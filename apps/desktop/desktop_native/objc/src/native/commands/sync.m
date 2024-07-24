#import <Foundation/Foundation.h>
#import <AuthenticationServices/ASCredentialIdentityStore.h>
#import <AuthenticationServices/ASCredentialIdentityStoreState.h>
#import <AuthenticationServices/ASCredentialServiceIdentifier.h>
#import <AuthenticationServices/ASPasswordCredentialIdentity.h>
#import "../interop.h"
#import "sync.h"

// 'run' is added to the name because it clashes with internal macOS function
void runSync(void* context, NSDictionary *params) {
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

  [ASCredentialIdentityStore.sharedStore saveCredentialIdentities:passwordCredentials
    completion:^(BOOL success, NSError * _Nullable error) {
      if (error) {
        _return(context, _error_er(error));
      } else {
        _return(context, _success(@{@"added": @([passwordCredentials count])}));
      }
    }];
}
