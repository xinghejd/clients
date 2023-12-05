use anyhow::Result;

pub fn create(window_handle: u64) -> Result<String> {
    Ok(ffi::webauthn_create(window_handle))
}

#[swift_bridge::bridge]
mod ffi {
    extern "Rust" {
        // fn rust_double_number(num: i64) -> i64;
    }

    extern "Swift" {
        fn webauthn_create(window_handle_uint: u64) -> String;
        // fn swift_multiply_by_4(num: i64) -> i64;
    }
}
