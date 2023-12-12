import AuthenticationServices
import os

enum AuthError: Error {
    case aborted
    case somethingElse
}

class AuthDelegate: NSObject, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    let window: NSWindow

    private var activeContinuation: CheckedContinuation<String, Error>?

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
        self.activeContinuation?.resume(returning: "Auth completed")
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
            self.activeContinuation?.resume(throwing: AuthError.aborted)
        } else {
            // Another ASAuthorization error.
            // Note: The userInfo dictionary contains useful information.
            logger.error("Error: \((error as NSError).userInfo)")
            self.activeContinuation?.resume(throwing: AuthError.somethingElse)
        }
    }

    func makeCredential() async throws -> String {
        return try await withCheckedThrowingContinuation { continuation in
            self.activeContinuation = continuation

            let logger = Logger()
            logger.log("Create()")

            let domain = "shiny.coroiu.com"

            let publicKeyCredentialProvider = ASAuthorizationPlatformPublicKeyCredentialProvider(relyingPartyIdentifier: domain)

            let userName = "user"
            let challenge = Data()
            let userID = Data(UUID().uuidString.utf8)

            let registrationRequest = publicKeyCredentialProvider.createCredentialRegistrationRequest(challenge: challenge,
                                                                                                      name: userName, userID: userID)
            let authController = ASAuthorizationController(authorizationRequests: [ registrationRequest ] )
            authController.delegate = self
            authController.presentationContextProvider = self

            logger.log("performing request")
            authController.performRequests()
        }
    }
}

func webauthn_create(window_handle_uint: UInt64) -> String {
    let authDelegate = AuthDelegate(window: NSApplication.shared.windows[0])

    Task {
        let logger = Logger()
        logger.log("creating passkey... window handle: \(window_handle_uint)")

        do {
            let _ = try await authDelegate.makeCredential()
            logger.log("AuthDelegate Success")
        } catch {
            logger.log("AuthDelegate Fail")
        }
    }

    return "Task executed"
}
