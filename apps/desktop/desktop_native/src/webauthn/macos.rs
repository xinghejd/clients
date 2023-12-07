use anyhow::Result;
use icrate::{
    ns_string,
    objc2::ClassType,
    AuthenticationServices::ASAuthorizationPlatformPublicKeyCredentialProvider,
    Foundation::{NSData, NSDataBase64DecodingIgnoreUnknownCharacters, NSString},
};

pub fn create(_window_handle: u64) -> Result<String> {
    let rp_id = ns_string!("shiny.coroiu.com"); // Example of how to create static "string literal" NSString
    let credential_provider = unsafe {
        ASAuthorizationPlatformPublicKeyCredentialProvider::initWithRelyingPartyIdentifier(
            ASAuthorizationPlatformPublicKeyCredentialProvider::alloc(),
            rp_id,
        )
    };

    let user_name = NSString::from_str("user"); // Example of how to create dynamic NSString
    let challenge = unsafe {
        NSData::initWithBase64EncodedString_options(
            NSData::alloc(),
            ns_string!("YW5kcmVhcyBjb3JvaXUgd2FzIGhlcmU="),
            NSDataBase64DecodingIgnoreUnknownCharacters,
        )
    };
    let user_id = unsafe {
        NSData::initWithBase64EncodedString_options(
            NSData::alloc(),
            ns_string!("6dnpKhnpRAS4diyuFwS+Rg=="), // e9d9e92a-19e9-4404-b876-2cae1704be46 in base64
            NSDataBase64DecodingIgnoreUnknownCharacters,
        )
    };

    let registration_request = unsafe {
        credential_provider.createCredentialRegistrationRequestWithChallenge_name_userID(
            challenge.unwrap().as_ref(),
            user_name.as_ref(),
            user_id.unwrap().as_ref(),
        )
    };

    println!("registration_request: {:?}", registration_request);

    Ok("not implemented".to_owned())
}
