use std::ffi::{c_char, c_int, CStr, CString};

use anyhow::Result;

extern "C" {
    fn hello_world(value: *const c_char, output: *mut c_char, output_size: c_int);
}

pub fn obj_hello_world(value: String) -> Result<String> {
    let c_value = CString::new(value).expect("CString::new failed");
    let objc_result = unsafe {
        let c_output: *mut c_char = [0; 1024].as_mut_ptr();
        hello_world(c_value.as_ptr(), c_output, 1024);
        CStr::from_ptr(c_output)
            .to_str()
            .expect("CStr::from_ptr failed")
            .to_owned()
    };

    println!(
        "[OBJC] Hello, world! Result of calling objc: {}",
        objc_result
    );
    Ok(objc_result)
}
