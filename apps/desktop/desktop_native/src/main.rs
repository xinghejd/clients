fn main() {
    ffi::create_passkey();
}

#[swift_bridge::bridge]
mod ffi {
    extern "Rust" {
        // No functions in rust callable from swift
    }

    extern "Swift" {
        fn create_passkey();
    }
}
