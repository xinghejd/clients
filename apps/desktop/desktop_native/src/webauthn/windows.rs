use anyhow::Result;
use widestring::U16CString;
use windows::{
    core::PCWSTR,
    Win32::{Foundation::HWND, Networking::WindowsWebServices::*},
};

pub fn create(window_handle: u64) -> Result<String> {
    println!("window_handle: {}", window_handle);

    let rp_id = U16CString::from_str("shiny.coroiu.com")?;
    let rp_name = U16CString::from_str("Shiny")?;
    let rp = WEBAUTHN_RP_ENTITY_INFORMATION {
        dwVersion: 1,
        pwszId: PCWSTR(rp_id.as_ptr()),
        pwszName: PCWSTR(rp_name.as_ptr()),
        pwszIcon: PCWSTR::null(),
    };

    unsafe {
        println!(
            "id: {:?}, name: {:?}",
            rp.pwszId.to_string()?,
            rp.pwszName.to_string()?
        )
    };
    let mut pb_id: [u8; 8] = [0; 8];
    let user_name = U16CString::from_str("shiny.user")?;
    let user_display_name = U16CString::from_str("Shiny User")?;
    let user = WEBAUTHN_USER_ENTITY_INFORMATION {
        dwVersion: 1,
        cbId: pb_id.len() as u32,
        pbId: pb_id.as_mut_ptr(),
        pwszName: PCWSTR(user_name.as_ptr()),
        pwszIcon: PCWSTR::null(),
        pwszDisplayName: PCWSTR(user_display_name.as_ptr()),
    };

    let pubkeycredparams = WEBAUTHN_COSE_CREDENTIAL_PARAMETERS {
        cCredentialParameters: 1,
        pCredentialParameters: &mut WEBAUTHN_COSE_CREDENTIAL_PARAMETER {
            dwVersion: 1,
            lAlg: WEBAUTHN_COSE_ALGORITHM_ECDSA_P256_WITH_SHA256,
            pwszCredentialType: WEBAUTHN_CREDENTIAL_TYPE_PUBLIC_KEY,
        },
    };

    let _challenge = 0x00;
    let mut clientdatajson = "{\
          \"challenge\": \"AA\",\
          \"origin\": \"https://demo.yubico.com\",\
          \"type\": \"webauthn.create\"\
        }"
    .to_owned();
    let clientdatajsonbytes = unsafe { clientdatajson.as_bytes_mut() };
    let clientdatajsonbytes_length = clientdatajsonbytes.len() as u32;

    let clientdata = WEBAUTHN_CLIENT_DATA {
        dwVersion: 1,
        cbClientDataJSON: clientdatajsonbytes_length,
        pbClientDataJSON: clientdatajsonbytes.as_mut_ptr(),
        pwszHashAlgId: WEBAUTHN_HASH_ALGORITHM_SHA_256,
    };

    let credentials = WEBAUTHN_CREDENTIALS {
        cCredentials: 0,
        pCredentials: std::ptr::null_mut(),
    };

    let extensions = WEBAUTHN_EXTENSIONS {
        cExtensions: 0,
        pExtensions: std::ptr::null_mut(),
    };

    let credential_options = WEBAUTHN_AUTHENTICATOR_MAKE_CREDENTIAL_OPTIONS {
        dwVersion: 5, // We want to support at least 6 to get PRF support, but `windows-rs` seems to be on version 5
        dwTimeoutMilliseconds: 0,
        CredentialList: credentials,
        Extensions: extensions,
        dwAuthenticatorAttachment: WEBAUTHN_AUTHENTICATOR_ATTACHMENT_ANY,
        bRequireResidentKey: true.into(),
        dwUserVerificationRequirement: WEBAUTHN_USER_VERIFICATION_REQUIREMENT_REQUIRED,
        dwAttestationConveyancePreference: WEBAUTHN_ATTESTATION_CONVEYANCE_PREFERENCE_NONE,
        dwFlags: 0,

        // Optional
        pCancellationId: std::ptr::null_mut(),
        pExcludeCredentialList: std::ptr::null_mut(),
        dwEnterpriseAttestation: WEBAUTHN_ENTERPRISE_ATTESTATION_NONE,
        dwLargeBlobSupport: WEBAUTHN_ENTERPRISE_ATTESTATION_NONE,
        bPreferResidentKey: true.into(),
        bBrowserInPrivateMode: false.into(),
    };

    let result = unsafe {
        WebAuthNAuthenticatorMakeCredential(
            HWND(window_handle as isize),
            &rp,
            &user,
            &pubkeycredparams,
            &clientdata,
            Option::Some(&credential_options),
        )
    };

    match result {
        Ok(_) => {
            println!("ok");
            Ok("Ok!".to_owned())
        }
        Err(e) => {
            println!("error: {:?}", e);
            Ok("Error!".to_owned())
        }
    }
}
