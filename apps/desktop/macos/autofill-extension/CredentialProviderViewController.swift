//
//  CredentialProviderViewController.swift
//  autofill-extension
//
//  Created by Andreas Coroiu on 2023-12-21.
//

import AuthenticationServices
import os

class CredentialProviderViewController: ASCredentialProviderViewController {
    let logger = Logger(subsystem: "com.bitwarden.desktop.autofill-extension", category: "credential-provider")

    let client = MacOsProviderClient.connect()
    
    
    @IBAction func cancel(_ sender: AnyObject?) {
        self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }

    @IBAction func passwordSelected(_ sender: AnyObject?) {
        let passwordCredential = ASPasswordCredential(user: "j_appleseed", password: "apple1234")
        self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
    }
    
    /*
     Implement this method if your extension supports showing credentials in the QuickType bar.
     When the user selects a credential from your app, this method will be called with the
     ASPasswordCredentialIdentity your app has previously saved to the ASCredentialIdentityStore.
     Provide the password by completing the extension request with the associated ASPasswordCredential.
     If using the credential would require showing custom UI for authenticating the user, cancel
     the request with error code ASExtensionError.userInteractionRequired.

     */

    // Deprecated
    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        logger.log("[autofill-extension] provideCredentialWithoutUserInteraction called \(credentialIdentity)")
        logger.log("[autofill-extension]     user \(credentialIdentity.user)")
        logger.log("[autofill-extension]     id \(credentialIdentity.recordIdentifier ?? "")")
        logger.log("[autofill-extension]     sid \(credentialIdentity.serviceIdentifier.identifier)")
        logger.log("[autofill-extension]     sidt \(credentialIdentity.serviceIdentifier.type.rawValue)")
        
//        let databaseIsUnlocked = true
//        if (databaseIsUnlocked) {
        let passwordCredential = ASPasswordCredential(user: credentialIdentity.user, password: "example1234")
            self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
//        } else {
//            self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code:ASExtensionError.userInteractionRequired.rawValue))
//        }
    }
    
    override func provideCredentialWithoutUserInteraction(for credentialRequest: any ASCredentialRequest) {
        if let request = credentialRequest as? ASPasskeyCredentialRequest {
            if let passkeyIdentity = request.credentialIdentity as? ASPasskeyCredentialIdentity {
                
                logger.log("[autofill-extension] provideCredentialWithoutUserInteraction2(passkey) called \(request)")
                
                class CallbackImpl: PreparePasskeyAssertionCallback {
                    let ctx: ASCredentialProviderExtensionContext
                    required init(_ ctx: ASCredentialProviderExtensionContext) {
                        self.ctx = ctx
                    }
                    
                    func onComplete(credential: PasskeyAssertionResponse) {
                        ctx.completeAssertionRequest(using: ASPasskeyAssertionCredential(
                            userHandle: credential.userHandle,
                            relyingParty: credential.relyingParty,
                            signature: credential.signature,
                            clientDataHash: credential.clientDataHash,
                            authenticatorData: credential.authenticatorData,
                            credentialID: credential.credentialId
                        ))
                    }
                    
                    func onError(error: BitwardenError) {
                        ctx.cancelRequest(withError: error)
                    }
                }
                
                let userVerification = switch request.userVerificationPreference {
                case .preferred:
                    UserVerification.preferred
                case .required:
                    UserVerification.required
                default:
                    UserVerification.discouraged
                }
                
                let req = PasskeyAssertionRequest(
                    relyingPartyId: passkeyIdentity.relyingPartyIdentifier,
                    userName: passkeyIdentity.userName,
                    credentialId: passkeyIdentity.credentialID,
                    userHandle: passkeyIdentity.userHandle,
                    recordIdentifier: passkeyIdentity.recordIdentifier,
                    clientDataHash: request.clientDataHash,
                    userVerification: userVerification
                )
                
                client.preparePasskeyAssertion(request: req, callback: CallbackImpl(self.extensionContext))
                return
            }
        }
        
        if let request = credentialRequest as? ASPasswordCredentialRequest {
            logger.log("[autofill-extension] provideCredentialWithoutUserInteraction2(password) called \(request)")
            return;
        }
       
        logger.log("[autofill-extension] provideCredentialWithoutUserInteraction2 called wrong")
        self.extensionContext.cancelRequest(withError: BitwardenError.Internal("Invalid authentication request"))
    }

    /*
     Implement this method if provideCredentialWithoutUserInteraction(for:) can fail with
     ASExtensionError.userInteractionRequired. In this case, the system may present your extension's
     UI and call this method. Show appropriate UI for authenticating the user then provide the password
     by completing the extension request with the associated ASPasswordCredential.

    override func prepareInterfaceToProvideCredential(for credentialIdentity: ASPasswordCredentialIdentity) {
    }
    */


    override func prepareInterfaceForExtensionConfiguration() {
        logger.log("[autofill-extension] prepareInterfaceForExtensionConfiguration called")
    }

    override func prepareInterface(forPasskeyRegistration registrationRequest: ASCredentialRequest) {
        if let passkeyIdentity = registrationRequest.credentialIdentity as? ASPasskeyCredentialIdentity {
            if let passkeyRegistration = registrationRequest as? ASPasskeyCredentialRequest {
                class CallbackImpl: PreparePasskeyRegistrationCallback {
                    let ctx: ASCredentialProviderExtensionContext
                    required init(_ ctx: ASCredentialProviderExtensionContext) {
                        self.ctx = ctx
                    }

                    func onComplete(credential: PasskeyRegistrationResponse) {
                        ctx.completeRegistrationRequest(using: ASPasskeyRegistrationCredential(
                            relyingParty: credential.relyingParty,
                            clientDataHash: credential.clientDataHash,
                            credentialID: credential.credentialId,
                            attestationObject: credential.attestationObject
                        ))
                    }

                    func onError(error: BitwardenError) {
                        ctx.cancelRequest(withError: error)
                    }
                }
                
                let userVerification = switch passkeyRegistration.userVerificationPreference {
                    case .preferred:
                        UserVerification.preferred
                    case .required:
                        UserVerification.required
                    default:
                        UserVerification.discouraged
                }

                let req = PasskeyRegistrationRequest(
                    relyingPartyId: passkeyIdentity.relyingPartyIdentifier,
                    userName: passkeyIdentity.userName,
                    userHandle: passkeyIdentity.userHandle,
                    clientDataHash: passkeyRegistration.clientDataHash,
                    userVerification: userVerification
                )
                client.preparePasskeyRegistration(request: req, callback: CallbackImpl(self.extensionContext))
            }
        }

        // If we didn't get a passkey, return an error
        self.extensionContext.cancelRequest(withError: BitwardenError.Internal("Invalid registration request"))
    }

    /*
      Prepare your UI to list available credentials for the user to choose from. The items in
      'serviceIdentifiers' describe the service the user is logging in to, so your extension can
      prioritize the most relevant credentials in the list.
     */
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        logger.log("[autofill-extension] prepareCredentialList for serviceIdentifiers: \(serviceIdentifiers.count)")

        for serviceIdentifier in serviceIdentifiers {
            logger.log("     service: \(serviceIdentifier.identifier)")
        }
    }

    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier], requestParameters: ASPasskeyCredentialRequestParameters) {
        logger.log("[autofill-extension] prepareCredentialList(passkey) for serviceIdentifiers: \(serviceIdentifiers.count)")
        logger.log("request parameters: \(requestParameters.relyingPartyIdentifier)")
        
        for serviceIdentifier in serviceIdentifiers {
            logger.log("     service: \(serviceIdentifier.identifier)")
        }
    }

}
