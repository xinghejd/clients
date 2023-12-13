use anyhow::Result;
use icrate::{
    objc2::{
        declare_class, msg_send_id,
        mutability::{self},
        rc::{Allocated, Id},
        runtime::ProtocolObject,
        ClassType, DeclaredClass,
    },
    AppKit::{NSApplication, NSWindow},
    AuthenticationServices::{
        ASAuthorization, ASAuthorizationController, ASAuthorizationControllerDelegate,
        ASAuthorizationControllerPresentationContextProviding,
        ASAuthorizationPlatformPublicKeyCredentialProvider, ASAuthorizationRequest,
    },
    Foundation::{
        ns_string, MainThreadMarker, NSArray, NSData, NSDataBase64DecodingIgnoreUnknownCharacters,
        NSError, NSObject, NSObjectProtocol, NSString,
    },
};

/*
* This is a hack to store the delegate in a static variable, because the delegate is required to
* live as long as the ASAuthorizationController. This is not possible to do as the function currently is
* structured, because the delegate is created on the stack and the function returns before the
* delegate is used. This is a problem because the delegate is dropped when the function returns.
*
* Proper fix:
* We should be able to fix this by making the function async and await the delegate to be called.
*/
static mut AUTH_DELEGATE: Option<Id<AuthDelegate>> = None;

pub fn create(_window_handle: u64) -> Result<String> {
    MainThreadMarker::run_on_main(|mtm| {
        let rp_id = ns_string!("shiny.coroiu.com"); // Example of how to create static "string literal" NSString
        let credential_provider = unsafe {
            ASAuthorizationPlatformPublicKeyCredentialProvider::initWithRelyingPartyIdentifier(
                mtm.alloc(),
                rp_id,
            )
        };

        let user_name = NSString::from_str("user"); // Example of how to create dynamic NSString
        let challenge = unsafe {
            NSData::initWithBase64EncodedString_options(
                mtm.alloc(),
                ns_string!("YW5kcmVhcyBjb3JvaXUgd2FzIGhlcmU="),
                NSDataBase64DecodingIgnoreUnknownCharacters,
            )
        };
        let user_id = unsafe {
            NSData::initWithBase64EncodedString_options(
                mtm.alloc(),
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
        unsafe { AUTH_DELEGATE = Some(AuthDelegate::new(mtm, main_window)) };

        // let authorization_requests = unsafe {
        //     NSArray::<Id<ASAuthorizationPlatformPublicKeyCredentialRegistrationRequest>>::arrayWithObject(registration_request)
        // };
        let registration_request = platform_registration_request.as_super().retain();
        let authorization_requests =
            NSArray::<ASAuthorizationRequest>::from_vec(vec![registration_request]);
        let auth_controller = unsafe {
            ASAuthorizationController::initWithAuthorizationRequests(
                mtm.alloc(),
                authorization_requests.as_ref(),
            )
        };

        let delegate_ref = unsafe {
            match AUTH_DELEGATE {
                None => panic!("auth_delegate is None"),
                Some(ref x) => x,
            }
        };

        let unwrapped_delegate = Id::clone(delegate_ref);
        let auth_controller_delegate = ProtocolObject::from_ref(&*unwrapped_delegate);
        unsafe { auth_controller.setDelegate(Some(auth_controller_delegate)) };

        let presentation_context_delegate = ProtocolObject::from_ref(&*unwrapped_delegate);
        unsafe {
            auth_controller.setPresentationContextProvider(Some(presentation_context_delegate))
        };
        // dbg!(auth_controller.as_ref());

        // unsafe {
        //     // dbg!()auth_controller.performRequests();
        //     // dbg!(auth_controller.presentationContextProvider());
        //     let auth_controller_ref = auth_controller.as_ref();
        //     let presentation_provider = auth_controller_ref.presentationContextProvider();
        //     let anchor = presentation_provider
        //         .unwrap()
        //         .presentationAnchorForAuthorizationController(auth_controller_ref);
        //     dbg!(anchor); // This correctly returns NSElectronWindow
        // }
        println!("Performing request");
        unsafe { auth_controller.performRequests() };
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
        #[method_id(presentationAnchorForAuthorizationController:)]
        unsafe fn presentationAnchorForAuthorizationController(
            &self,
            controller: &ASAuthorizationController,
        ) -> Id<NSWindow> {
            println!("presentationAnchorForAuthorizationController CALLED!");
            Id::clone(&self.ivars().window)
        }

        // #[allow(non_snake_case)]
        // #[method(presentationAnchorForAuthorizationController:)]
        // unsafe fn presentationAnchorForAuthorizationController(
        //     &self,
        //     controller: &ASAuthorizationController,
        // ) -> *const NSWindow {
        //     let ptr = Id::as_ptr(&self.ivars().window);
        //     ptr
        // }
    }
);

impl AuthDelegate {
    pub fn new(mtm: MainThreadMarker, window: Id<NSWindow>) -> Id<Self> {
        let this = mtm.alloc();
        AuthDelegate::init(this, window)
    }

    pub fn init(this: Allocated<Self>, window: Id<NSWindow>) -> Id<Self> {
        let this = this.set_ivars(AuthDelegateIvars { window });
        unsafe { msg_send_id![super(this), init] }
    }
}
