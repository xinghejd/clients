use webauthn_authenticator_rs::{ctap2::{self, Ctap20Authenticator, CtapAuthenticator}, transport::{AnyTransport, Token, TokenEvent, Transport}, types::{CableRequestType, CableState, EnrollSampleStatus}, ui::UiCallback, AuthenticatorBackend};
use webauthn_rs::prelude::Url;
use core::panic;
use std::{borrow::Borrow, env, f32::consts::E, fs::OpenOptions, pin};
use futures::StreamExt;

pub async fn authenticate(challenge: String, origin: String) -> String {
    println!("Challenge: {}", challenge);
    println!("Origin: {}", origin);
    let pin = env::var("PIN").unwrap_or_else(|_| "1234".to_string());
    println!("PIN: {}", pin);

    let pinentry = Pinentry {
        pin: pin.to_string(),
    };

    let mut auth = get_authenticator(&pinentry).await;
    let options = serde_json::from_str(challenge.as_str()).unwrap();
    let origin = Url::parse("https://localhost:8080").unwrap();
    let res = auth.perform_auth(origin, options, 60000);
    println!("res {:?}", res);
    let pkcred = res.unwrap();
    let pkcred_string = serde_json::to_string(&pkcred).unwrap();
    pkcred_string
}


#[derive(Debug)]
struct Pinentry {
    pin: String,
}

async fn get_authenticator<U: UiCallback>(ui: &U) -> impl AuthenticatorBackend + '_ {
    let mut trans = AnyTransport::new().await.unwrap();
    match trans.watch().await {
        Ok(mut tokens) => {
            while let Some(event) = tokens.next().await {
                match event {
                    TokenEvent::Added(token) => {
                        let auth = CtapAuthenticator::new(token, ui).await;

                        if let Some(auth) = auth {
                            return auth;
                        }
                    }

                    TokenEvent::EnumerationComplete => {
                        println!("device enumeration completed without detecting a FIDO2 authenticator, connect one to authenticate!");
                    }

                    TokenEvent::Removed(_) => {}
                }
            }
        }
        Err(e) => panic!("Error: {e:?}"),
    }
    panic!("No authenticator found");
}

impl UiCallback for Pinentry {
    fn request_pin(&self) -> Option<String> {
        println!("Requesting pin: {}", self.pin);
        Some(self.pin.clone())
    }

    fn request_touch(&self) {
        println!("Called unimplemented method: request_touch")
    }

    fn processing(&self) {
        println!("Called unimplemented method: processing")
    }
    
    fn fingerprint_enrollment_feedback(
        &self,
        remaining_samples: u32,
        feedback: Option<EnrollSampleStatus>,
    ) {
        println!("Unimplemented method fingerprint_enrollment_feedback called")
    }
    
    fn cable_qr_code(&self, request_type: CableRequestType, url: String) {
        println!("Unimplemented method cable_qr_code called")
    }
    
    fn dismiss_qr_code(&self) {
        println!("Unimplemented method dismiss_qr_code called")
    }
    
    fn cable_status_update(&self, state: CableState) {
        println!("Unimplemented method cable_status_update called")
    }
}