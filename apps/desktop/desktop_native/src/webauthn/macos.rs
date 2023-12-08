use anyhow::Result;
use icrate::{
    objc2::{
        declare_class, extern_methods, mutability::InteriorMutable, rc::Id, ClassType,
        DeclaredClass,
    },
    AppKit::NSWindow,
    AuthenticationServices::ASAuthorizationPlatformPublicKeyCredentialProvider,
    Foundation::{
        ns_string, NSData, NSDataBase64DecodingIgnoreUnknownCharacters, NSObject, NSString,
    },
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

struct AuthDelegateIvars {
    window: Id<NSWindow>,
}

declare_class!(
    struct AuthDelegate;

    unsafe impl ClassType for AuthDelegate {
        type Super = NSObject;
        type Mutability = InteriorMutable;
        const NAME: &'static str = "AuthDelegate";
    }

    impl DeclaredClass for AuthDelegate {
        type Ivars = AuthDelegateIvars;
    }

//     unsafe impl MyObject {
//         #[method_id(init)]
//         pub fn init(this: Allocated<Self>) -> Option<Id<Self>> {
//             let this = this.set_ivars(MyIvars {
//                 object: NSObject::new(),
//             });
//             unsafe { msg_send_id![super(this), init] }
//         }
//     }
);

// extern_methods!(
//     unsafe impl MyObject {
//         #[method_id(new)]
//         pub fn new() -> Id<Self>;
//     }
// );

// fn main() {
//     let obj = MyObject::new();
//     println!("{:?}", obj.ivars().object);
// }
