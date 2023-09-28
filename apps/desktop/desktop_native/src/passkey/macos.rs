use icrate::AuthenticationServices::ASAuthorizationPlatformPublicKeyCredentialProvider;

#[cfg(test)]
mod tests {
    use icrate::{
        ns_string,
        AuthenticationServices::{
            ASAuthorizationController, ASAuthorizationPlatformPublicKeyCredentialAssertionRequest,
        },
        Foundation::{NSArray, NSData},
    };
    use objc2::{
        msg_send_id,
        rc::{Allocated, Id},
        ClassType,
    };

    use super::*;

    #[test]
    fn test() {
        unsafe {
            let _obj: Allocated<ASAuthorizationPlatformPublicKeyCredentialProvider> = unsafe {
                msg_send_id![
                    ASAuthorizationPlatformPublicKeyCredentialProvider::class(),
                    alloc
                ]
            };

            let platform_provider =
                ASAuthorizationPlatformPublicKeyCredentialProvider::initWithRelyingPartyIdentifier(
                    Some(_obj),
                    ns_string!("vault.bitwarden.com"),
                );

            println!("{:?}", platform_provider);

            let b64challenge = "D83VJVia09CYVOqfOYQB7Q";
            let challenge = base64_url::decode(b64challenge).unwrap();
            let data = NSData::with_bytes(challenge.as_slice());

            let request =
                platform_provider.createCredentialAssertionRequestWithChallenge(data.as_ref());

            println!("{:?}", request);

            let _obj: Allocated<ASAuthorizationController> =
                unsafe { msg_send_id![ASAuthorizationController::class(), alloc] };

            let t = Id::<ASAuthorizationPlatformPublicKeyCredentialAssertionRequest>::into_super(
                request,
            );

            let array = NSArray::from_vec(vec![t]);
            let authController = ASAuthorizationController::initWithAuthorizationRequests(
                Some(_obj),
                array.as_ref(),
            );

            authController.performRequests();

            println!("{:?}", authController.as_ref());
        };
    }
}
