// examples:
//   "username" > "forwarder" > "${forwarderId}"
//   "password" > "passphrase"
//   "password" > "password"
//
// * It pins multiple paths:
//   last: ["username", "forwarder", "trust-us"]
//   proof: ["password"]
//   identity: ["forwader", "trust-us"]
//
// * "proof" - defaults to last-visited between password/passphrase
//           - overridden by policy (default type) on save
//           - when policy changes, "proof" is overwritten
//           - used as default for password/passphrase selection in "classic" ui
//           - used for password generation w/o ui (e.g. web)
// * "identity" - defaults to last-visited username sub-path
//              - used for password generation w/o ui (e.g web)
// * "last" - defaults to last-visted overall
//          - if default type policy is active, this is overridden
//            when first loaded, but retains its value thereafter.

// Service exposes all 3 as endpoints & specialized update values.
// proof$ / proof("password") <-- applies policy during save
// identity$ / identity("forwarder", "trust-us") <-- just saves value
// visited$ <-- "visited" always comes from the last saved `proof(...)` or `identity(...)`.

// the cascade includes settings, generator logic, and so forth for the leaf entry:
// {
//   cascade: [],
//   settings: {
//    // whatever was loaded from state for the selected cascade
//   }
//
// }
