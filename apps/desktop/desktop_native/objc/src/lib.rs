use std::ffi::{c_char, CStr, CString};

use anyhow::{Context, Result};

#[repr(C)]
pub struct ObjCString {
    value: *const c_char,
    size: usize,
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
    use super::*;

    extern "C" {
        pub fn runCommand(value: *const c_char) -> ObjCString;
        pub fn freeObjCString(value: &ObjCString);
    }
}

pub fn run_command(input: String) -> Result<String> {
    // Convert input to type that can be passed to ObjC code
    let c_input = CString::new(input)
        .context("Failed to convert Rust input string to a CString for use in call to ObjC code")?;

    // Call ObjC code
    let output = unsafe { objc::runCommand(c_input.as_ptr()) };

    // Convert output from ObjC code to Rust string
    let objc_output = output.try_into()?;

    Ok(objc_output)
}
