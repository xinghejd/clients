use anyhow::Result;
use icrate::{
    objc2::{
        declare_class, msg_send_id,
        mutability::{self, InteriorMutable},
        rc::{Allocated, Id},
        runtime::ProtocolObject,
        ClassType, DeclaredClass, Encoding, RefEncode,
    },
    AppKit::{NSApplication, NSWindow},
    AuthenticationServices::{
        ASAuthorization, ASAuthorizationController, ASAuthorizationControllerDelegate,
        ASAuthorizationControllerPresentationContextProviding,
        ASAuthorizationPlatformPublicKeyCredentialProvider, ASAuthorizationRequest,
        ASPresentationAnchor,
    },
    Foundation::{
        ns_string, MainThreadMarker, NSArray, NSData, NSDataBase64DecodingIgnoreUnknownCharacters,
        NSError, NSObject, NSObjectProtocol, NSString,
    },
};

pub fn create(_window_handle: u64) -> Result<String> {
    MainThreadMarker::run_on_main(|mtm| {
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

        let platform_registration_request = unsafe {
            credential_provider.createCredentialRegistrationRequestWithChallenge_name_userID(
                challenge.unwrap().as_ref(),
                user_name.as_ref(),
                user_id.unwrap().as_ref(),
            )
        };

        println!("registration_request: {:?}", platform_registration_request);

        let main_window = unsafe {
            NSApplication::sharedApplication(mtm)
                .windows()
                .objectAtIndex(0)
        };
        let auth_delegate = AuthDelegate::init(AuthDelegate::alloc(), main_window);

        // let authorization_requests = unsafe {
        //     NSArray::<Id<ASAuthorizationPlatformPublicKeyCredentialRegistrationRequest>>::arrayWithObject(registration_request)
        // };
        let registration_request = platform_registration_request.as_super().retain();
        let authorization_requests =
            NSArray::<ASAuthorizationRequest>::from_vec(vec![registration_request]);
        let auth_controller = unsafe {
            ASAuthorizationController::initWithAuthorizationRequests(
                ASAuthorizationController::alloc(),
                authorization_requests.as_ref(),
            )
        };
        let unwrapperd_delegate = auth_delegate.unwrap();

        let auth_controller_delegate = ProtocolObject::from_ref(&*unwrapperd_delegate);
        unsafe { auth_controller.setDelegate(Some(auth_controller_delegate)) };

        let presentation_context_delegate = ProtocolObject::from_ref(&*unwrapperd_delegate);
        unsafe { auth_controller.setPresentationContextProvider(presentation_context_delegate) };
    });

    Ok("not implemented".to_owned())
}

#[allow(unused)]
struct AuthDelegateIvars {
    window: Id<NSWindow>,
}

declare_class!(
    struct AuthDelegate;

    unsafe impl ClassType for AuthDelegate {
        type Super = NSObject;
        // type Mutability = InteriorMutable;
        type Mutability = mutability::MainThreadOnly;
        const NAME: &'static str = "AuthDelegate";
    }

    impl DeclaredClass for AuthDelegate {
        type Ivars = AuthDelegateIvars;
    }

    unsafe impl NSObjectProtocol for AuthDelegate {}

    unsafe impl ASAuthorizationControllerDelegate for AuthDelegate {
        #[allow(non_snake_case)]
        #[method(authorizationController:didCompleteWithAuthorization:)]
        unsafe fn authorizationController_didCompleteWithAuthorization(
            &self,
            controller: &ASAuthorizationController,
            authorization: &ASAuthorization,
        ) {
            println!("didCompleteWithAuthorization SUCCESS");
        }

        #[allow(non_snake_case)]
        #[method(authorizationController:didCompleteWithError:)]
        unsafe fn authorizationController_didCompleteWithError(
            &self,
            controller: &ASAuthorizationController,
            error: &NSError,
        ) {
            println!("didCompleteWithError FAIL");
        }
    }

    unsafe impl ASAuthorizationControllerPresentationContextProviding for AuthDelegate {
        #[allow(non_snake_case)]
        #[method(presentationAnchorForAuthorizationController:)]
        unsafe fn presentationAnchorForAuthorizationController(
            &self,
            controller: &ASAuthorizationController,
        ) -> Id<ASPresentationAnchor> {
            self.ivars().window
        }
    }
);

// unsafe impl RefEncode for Id<ASPresentationAnchor> {
//     const ENCODING_REF: Encoding = Encoding::Object;
// }

impl AuthDelegate {
    pub fn init(this: Allocated<Self>, window: Id<NSWindow>) -> Option<Id<Self>> {
        let this = this.set_ivars(AuthDelegateIvars { window });
        unsafe { msg_send_id![super(this), init] }
    }
}

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
