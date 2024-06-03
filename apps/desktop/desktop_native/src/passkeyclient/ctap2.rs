use serde::{Deserialize, Serialize};
use serde;
use webauthn_authenticator_rs::{ctap2::CtapAuthenticator, transport::{AnyTransport, TokenEvent, Transport}, types::{CableRequestType, CableState, EnrollSampleStatus}, ui::UiCallback, AuthenticatorBackend};
use webauthn_rs::prelude::{Base64UrlSafeData, Url};
use std::sync::{Arc, Mutex};
use futures::StreamExt;

const TIMEOUT: u32 = 60000;

pub async fn authenticate(challenge: String, origin: String, pin: Option<String>) -> Result<String, anyhow::Error> {
    let pinentry = Pinentry {
        pin: Arc::new(Mutex::new(pin)),
        pin_required: Arc::new(Mutex::new(false)),
    };

    let mut auth = get_authenticator(&pinentry).await?;
    
    let options = serde_json::from_str(challenge.as_str())?;
    let origin = Url::parse(origin.as_str())?;
    let res = auth.perform_auth(origin, options, TIMEOUT);
    if res.is_err() && *pinentry.pin_required.lock().map_err(|e| anyhow::Error::msg(format!("Error: {:?}", e)))? {
        return Err(anyhow::Error::msg("Pin required"));
    }
    let res: webauthn_rs::prelude::PublicKeyCredential = res.map_err(|e| anyhow::Error::msg(format!("Error: {:?}", e)))?;
    serialize_publickeycredential(res)
}

#[derive(Debug)]
struct Pinentry {
    pin: Arc<Mutex<Option<String>>>,
    pin_required: Arc<Mutex<bool>>,
}

async fn get_authenticator<U: UiCallback>(ui: &U) -> Result<impl AuthenticatorBackend + '_, anyhow::Error> {
    let trans = AnyTransport::new().await.unwrap();
    match trans.watch().await {
        Ok(mut tokens) => {
            while let Some(event) = tokens.next().await {
                match event {
                    TokenEvent::Added(token) => {
                        let auth = CtapAuthenticator::new(token, ui).await;

                        if let Some(auth) = auth {
                            return Ok(auth);
                        }
                    }

                    TokenEvent::EnumerationComplete => {
                        println!("device enumeration completed without detecting a FIDO2 authenticator, connect one to authenticate!");
                    }

                    TokenEvent::Removed(_) => {}
                }
            }
        }
        Err(e) => {
            println!("Error: {:?}", e);
        }
    }
    Err(anyhow::Error::msg("No authenticator found"))
}

impl UiCallback for Pinentry {
    fn request_pin(&self) -> Option<String> {
        let mut pin_required = self.pin_required.lock().unwrap();
        *pin_required = true;

        let pin = self.pin.lock().unwrap().clone();
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
        _remaining_samples: u32,
        _feedback: Option<EnrollSampleStatus>,
    ) {
        println!("Unimplemented method fingerprint_enrollment_feedback called")
    }
    
    fn cable_qr_code(&self, _request_type: CableRequestType, _url: String) {
        println!("Unimplemented method cable_qr_code called")
    }
    
    fn dismiss_qr_code(&self) {
        println!("Unimplemented method dismiss_qr_code called")
    }
    
    fn cable_status_update(&self, _state: CableState) {
        println!("Unimplemented method cable_status_update called")
    }
}

fn serialize_publickeycredential(credential: webauthn_rs::prelude::PublicKeyCredential) -> Result<String, anyhow::Error> {
    serde_json::to_string(&TwoFactorAuthToken {
        id: credential.id,
        raw_id: credential.raw_id,
        type_: credential.type_,
        authenticator_data: WebauthnResponseData {
            authenticator_data: credential.response.authenticator_data,
            client_data_json: credential.response.client_data_json,
            signature: credential.response.signature,
        },
        extensions: WebauthnExtensions {
            appid: Some(false),
        },
    }).map_err(|e| anyhow::Error::msg(format!("Error: {:?}", e)))
}

// json
#[derive(Debug, Serialize, Deserialize)]
struct WebauthnResponseData {
    #[serde(rename = "authenticatorData")]
    authenticator_data: Base64UrlSafeData,
    #[serde(rename = "clientDataJson")]
    client_data_json: Base64UrlSafeData,
    signature: Base64UrlSafeData,
}

#[derive(Debug, Serialize, Deserialize)]
struct WebauthnExtensions {
    appid: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize)]
struct TwoFactorAuthToken {
    id: String,
    #[serde(rename = "rawId")]
    raw_id: Base64UrlSafeData,
    #[serde(rename = "type")]
    type_: String,
    #[serde(rename = "authenticatorData")]
    authenticator_data: WebauthnResponseData,
    extensions: WebauthnExtensions,
}