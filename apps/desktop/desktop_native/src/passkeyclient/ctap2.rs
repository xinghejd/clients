use webauthn_authenticator_rs::{ctap2::CtapAuthenticator, transport::{AnyTransport, Token, TokenEvent, Transport}, types::{CableRequestType, CableState, EnrollSampleStatus}, ui::UiCallback, AuthenticatorBackend};
use webauthn_rs::prelude::Url;
use core::panic;
use std::{any::Any, borrow::Borrow, env, sync::{Arc, Mutex}};
use futures::StreamExt;

pub async fn authenticate(challenge: String, origin: String, pin: Option<String>) -> Result<String, anyhow::Error> {
    let pinentry = Pinentry {
        pin: Arc::new(Mutex::new(pin)),
        pin_required: Arc::new(Mutex::new(false)),
    };

    let mut auth = get_authenticator(&pinentry).await;
    
    let options = serde_json::from_str(challenge.as_str())?;
    let origin = Url::parse(origin.as_str())?;
    let res = auth.perform_auth(origin, options, 60000);
    if res.is_err() && *pinentry.pin_required.lock().unwrap() {
        return Err(anyhow::Error::msg("Pin required"));
    }
    println!("res: {:?}", res);
    let res = res.map_err(|e| anyhow::Error::msg(format!("Error: {:?}", e)))?;
    Ok(serde_json::to_string(&res)?
        .replace("\"appid\":null,\"hmac_get_secret\":null", "\"appid\":false")
        .replace("clientDataJSON", "clientDataJson"))
}


#[derive(Debug)]
struct Pinentry {
    pin: Arc<Mutex<Option<String>>>,
    pin_required: Arc<Mutex<bool>>,
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
        let mut pin_required = self.pin_required.lock().unwrap();
        *pin_required = true;

        let pin = self.pin.lock().unwrap().clone();
        println!("ui callback pin: {:?}", pin);
        pin
    }

    fn request_touch(&self) {
        println!("Please touch your authenticator.")
    }

    fn processing(&self) {
        println!("Unimplemented method processing called")
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