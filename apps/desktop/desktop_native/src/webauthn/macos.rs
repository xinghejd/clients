use anyhow::Result;

pub fn create() -> Result<String> {
    Ok(ffi::webauthn_create())
}

#[swift_bridge::bridge]
mod ffi {
    extern "Rust" {
        // fn rust_double_number(num: i64) -> i64;
    }

    extern "Swift" {
        fn webauthn_create() -> String;
        // fn swift_multiply_by_4(num: i64) -> i64;
    }
}
