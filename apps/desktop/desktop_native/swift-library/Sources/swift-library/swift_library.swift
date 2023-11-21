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
        return window
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        print("Authorization completed")
    }
}

func webauthn_create() -> String {
    let logger = Logger()
    logger.log("creating passkey...")
    print("Creating passkey...")

    do {
        try create()
        return "success!"
    } catch {
        logger.log("Error: \(error)")
        print("Error: \(error)")
        return "Error: \(error)"
    }
}

func create() throws {
    let logger = Logger()

    let domain = "shiny.coroiu.com"

    let publicKeyCredentialProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)

    let userName = "user"
    let challenge = Data()
    let userID = Data(UUID().uuidString.utf8)

    let registrationRequest = publicKeyCredentialProvider.createCredentialRegistrationRequest(challenge: challenge,
                                                                                              name: userName, userID: userID)

    let authController = ASAuthorizationController(authorizationRequests: [ registrationRequest ] )

    logger.log("first window \(NSApplication.shared.windows.first!.description)")
    NSApplication.shared.windows.first!.toggleFullScreen(nil)
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
