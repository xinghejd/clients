use std::ffi::{c_char, CStr, CString};

use anyhow::{Context, Result};

#[repr(C)]
pub struct ObjCString {
    value: *const c_char,
    size: usize,
}

#[repr(C)]
pub struct CommandContext {
    tx: Option<tokio::sync::oneshot::Sender<String>>,
}

impl CommandContext {
    pub fn new() -> (Self, tokio::sync::oneshot::Receiver<String>) {
        let (tx, rx) = tokio::sync::oneshot::channel::<String>();

        (CommandContext { tx: Some(tx) }, rx)
    }

    pub fn send(&mut self, value: String) -> Result<()> {
        let tx = self.tx.take().context(
            "Failed to take Sender from CommandContext. Has this context already returned once?",
        )?;

        tx.send(value).map_err(|_| {
            anyhow::anyhow!("Failed to send ObjCString from CommandContext to Rust code")
        })?;

        Ok(())
    }
}

impl TryFrom<ObjCString> for String {
    type Error = anyhow::Error;

    fn try_from(value: ObjCString) -> Result<Self> {
        let c_str = unsafe { CStr::from_ptr(value.value) };
        let str = c_str
            .to_str()
            .context("Failed to convert ObjC output string to &str for use in Rust")?;

        Ok(str.to_owned())
    }
}

impl Drop for ObjCString {
    fn drop(&mut self) {
        unsafe {
            objc::freeObjCString(self);
        }
    }
}

mod objc {
    use std::ffi::c_int;

    use super::*;

    extern "C" {
        pub fn runCommand(context: &mut CommandContext, value: *const c_char) -> ObjCString;
        pub fn freeObjCString(value: &ObjCString);
    }

    /// This function is called from the ObjC code to return the output of the command
    #[no_mangle]
    pub extern "C" fn commandReturn(context: &mut CommandContext, value: ObjCString) -> c_int {
        let value: String = match value.try_into() {
            Ok(value) => value,
            Err(e) => {
                println!(
                    "Error: Failed to convert ObjCString to Rust string during commandReturn: {}",
                    e
                );

                return 1;
            }
        };

        match context.send(value) {
            Ok(_) => 0,
            Err(e) => {
                println!(
                    "Error: Failed to return ObjCString from ObjC code to Rust code: {}",
                    e
                );

                1
            }
        }
    }
}

pub async fn run_command(input: String) -> Result<String> {
    // Convert input to type that can be passed to ObjC code
    let c_input = CString::new(input)
        .context("Failed to convert Rust input string to a CString for use in call to ObjC code")?;

    let (mut context, rx) = CommandContext::new();

    // Call ObjC code
    unsafe { objc::runCommand(&mut context, c_input.as_ptr()) };

    // Convert output from ObjC code to Rust string
    let objc_output = rx.await?.try_into()?;

    // Convert output from ObjC code to Rust string
    // let objc_output = output.try_into()?;

    Ok(objc_output)
}
