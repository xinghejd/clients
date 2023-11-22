@_cdecl("__swift_bridge__$webauthn_create")
func __swift_bridge__webauthn_create (_ window_handle_uint: UInt64) -> UnsafeMutableRawPointer {
    { let rustString = webauthn_create(window_handle_uint: window_handle_uint).intoRustString(); rustString.isOwned = false; return rustString.ptr }()
}



