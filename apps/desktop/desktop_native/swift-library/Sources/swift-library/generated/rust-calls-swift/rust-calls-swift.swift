@_cdecl("__swift_bridge__$webauthn_create")
func __swift_bridge__webauthn_create () -> UnsafeMutableRawPointer {
    { let rustString = webauthn_create().intoRustString(); rustString.isOwned = false; return rustString.ptr }()
}



