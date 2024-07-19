use std::ffi::{c_char, CStr, CString};

use anyhow::Result;

#[repr(C)]
pub struct ObjCString {
    value: *const c_char,
    size: usize,
}

impl From<ObjCString> for String {
    fn from(value: ObjCString) -> Self {
        unsafe {
            CStr::from_ptr(value.value)
                .to_str()
                .expect("CStr::from_ptr failed")
                .to_owned()
        }
    }
}

impl Drop for ObjCString {
    fn drop(&mut self) {
        unsafe {
            free_objc_string(self);
        }
    }
}

extern "C" {
    fn hello_world(value: *const c_char) -> ObjCString;
    fn free_objc_string(value: &ObjCString);
}

pub fn obj_hello_world(value: String) -> Result<String> {
    let c_value = CString::new(value).expect("CString::new failed");
    let objc_result = unsafe {
        let output = hello_world(c_value.as_ptr());
        output.into()
    };

    println!(
        "[BW][rust][objc-crate] Hello, world! Result of calling objc: {}",
        objc_result
    );
    Ok(objc_result)
}
