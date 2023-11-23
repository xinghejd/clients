import AuthenticationServices
import os

// class ApplicationDelegate: NSObject, NSApplicationDelegate, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
// // class ApplicationDelegate: NSObject, NSApplicationDelegate {
//     let window: NSWindow
//     let authController: ASAuthorizationController
//     // var result: Result = .error("task did not finish")

//     init(window: NSWindow, authController: ASAuthorizationController) {
//         self.window = window
//         self.authController = authController
//     }

//     func applicationDidFinishLaunching(_ notification: Notification) {
//         authController.delegate = self
//         authController.presentationContextProvider = self
//         // authController.performRequests()
//     }

//     func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
//         return window
//     }

//     func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
//         print("Authorization completed")
//     //     if let credential = authorization.credential as? ASAuthorizationSecurityKeyPublicKeyCredentialRegistration {
//     //         let rawId = credential.credentialID.toBase64Url()
//     //         let clientDataJSON = credential.rawClientDataJSON.toBase64Url()
//     //         let attestationObject = credential.rawAttestationObject!.toBase64Url()
//     //         self.result = .ok([
//     //             "id": rawId,
//     //             "rawId": rawId,
//     //             "type": "public-key",
//     //             "response": [
//     //                 "clientDataJSON": clientDataJSON,
//     //                 "attestationObject": attestationObject
//     //             ]
//     //         ])
//     //     } else if let credential = authorization.credential as? ASAuthorizationSecurityKeyPublicKeyCredentialAssertion {
//     //         let signature = credential.signature.toBase64Url()
//     //         let clientDataJSON = credential.rawClientDataJSON.toBase64Url()
//     //         let authenticatorData = credential.rawAuthenticatorData.toBase64Url()
//     //         let rawId = credential.credentialID.toBase64Url()
//     //         self.result = .ok([
//     //             "id": rawId,
//     //             "rawId": rawId,
//     //             "type": "public-key",
//     //             "response": [
//     //                 "clientDataJSON": clientDataJSON,
//     //                 "authenticatorData": authenticatorData,
//     //                 "signature": signature
//     //             ]
//     //         ])
//     //     } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialRegistration {
//     //         let rawId = credential.credentialID.toBase64Url()
//     //         let clientDataJSON = credential.rawClientDataJSON.toBase64Url()
//     //         let attestationObject = credential.rawAttestationObject!.toBase64Url()
//     //         self.result = .ok([
//     //             "id": rawId,
//     //             "rawId": rawId,
//     //             "type": "public-key",
//     //             "response": [
//     //                 "clientDataJSON": clientDataJSON,
//     //                 "attestationObject": attestationObject
//     //             ]
//     //         ])
//     //     } else if let credential = authorization.credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion {
//     //         let signature = credential.signature.toBase64Url()
//     //         let clientDataJSON = credential.rawClientDataJSON.toBase64Url()
//     //         let authenticatorData = credential.rawAuthenticatorData.toBase64Url()
//     //         let rawId = credential.credentialID.toBase64Url()
//     //         self.result = .ok([
//     //             "id": rawId,
//     //             "rawId": rawId,
//     //             "type": "public-key",
//     //             "response": [
//     //                 "clientDataJSON": clientDataJSON,
//     //                 "authenticatorData": authenticatorData,
//     //                 "signature": signature
//     //             ]
//     //         ])
//     //     } else {
//     //         self.result = .error("unhandled credential")
//     //     }
//     //     NSApplication.shared.stop(0)
//     }

//     func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
//         // self.result = .error(error.localizedDescription)
//         NSApplication.shared.stop(0)
//     }
// }

class AuthDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    let window: NSWindow

    init(window: NSWindow) {
        self.window = window
    }

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        let logger = Logger()
        logger.log("presentationAnchor")
        return window
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        let logger = Logger()
        logger.log("Authorization completed")
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        let logger = Logger()
        guard let authorizationError = error as? ASAuthorizationError else {
            logger.error("Unexpected authorization error: \(error.localizedDescription)")
            return
        }

        if authorizationError.code == .canceled {
            // Either the system doesn't find any credentials and the request ends silently, or the user cancels the request.
            // This is a good time to show a traditional login form, or ask the user to create an account.
            logger.log("Request canceled.")
        } else {
            // Another ASAuthorization error.
            // Note: The userInfo dictionary contains useful information.
            logger.error("Error: \((error as NSError).userInfo)")
        }
    }
}

func webauthn_create(window_handle_uint: UInt64) -> String {
    let logger = Logger()
    logger.log("creating passkey... window handle: \(window_handle_uint)")

    let window_count = NSApplication.shared.windows.count
    logger.log("creating passkey... window count: \(window_count)")

    let window_title = NSApplication.shared.windows[0].title
    logger.log("creating passkey... window title: \(window_title)")

    // let window_handle = Int(truncatingIfNeeded: window_handle_uint)
    // let ptr = UnsafeMutablePointer<NSView>(bitPattern: window_handle)
    // let title = ptr?.pointee.window?.title

    // logger.log("creating passkey... window title: \(title ?? "nil")")

    // do {
    return create()
    // } catch {
    //     logger.log("Error: \(error)")
    //     print("Error: \(error)")
    //     return "Error: \(error)"
    // }
}

func create() -> String {
    let logger = Logger()
    logger.log("Create()")

    let domain = "shiny.coroiu.com"

    let publicKeyCredentialProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)

    let userName = "user"
    let challenge = Data()
    let userID = Data(UUID().uuidString.utf8)

    let registrationRequest = publicKeyCredentialProvider.createCredentialRegistrationRequest(challenge: challenge,
                                                                                              name: userName, userID: userID)

    let authDelegate = AuthDelegate(window: NSApplication.shared.windows[0])
    let authController = ASAuthorizationController(authorizationRequests: [ registrationRequest ] )
    authController.delegate = authDelegate
    authController.presentationContextProvider = authDelegate

    logger.log("performing request")
    authController.performRequests()

    if let bundleIdentifier = Bundle.main.bundleIdentifier {
        return bundleIdentifier
    }

    return "ok"

    // let authController = ASAuthorizationController(authorizationRequests: [ registrationRequest ] )

    // logger.log("first window \(NSApplication.shared.windows.first!.description)")
    // NSApplication.shared.windows.first!.toggleFullScreen(nil)
    // authController.delegate = AuthDelegate(window: NSApplication.shared.windows.first!)

    // authController.delegate = AuthDelegate(window: NSApplication.shared.windows.first!)
    // authController.delegate = self
    // authController.presentationContextProvider = self
    // authController.performRequests()
    // logger.log("create() - 134a")

    // NSApplication.shared.setActivationPolicy(.regular)
    // logger.log("create() - 137")
    // let window = NSWindow(contentRect: NSMakeRect(0, 0, 200, 200), styleMask: [.titled, .closable], backing: .buffered, defer: false)
    // // window.center()
    // // window.makeKeyAndOrderFront(window)

    // logger.log("create() - 142")

    // let applicationDelegate = ApplicationDelegate(window: window, authController: authController)
    // // let applicationDelegate = ApplicationDelegate(window: window)
    // NSApplication.shared.delegate = applicationDelegate

    // logger.log("create() - 148")

    // NSApplication.shared.activate(ignoringOtherApps: true)

    // logger.log("create() - 152")

    // NSApplication.shared.run()

    // logger.log("create() - 156")
}
