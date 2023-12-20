//
//  CredentialProviderViewController.swift
//  passkey-provider-swift
//
//  Created by Andreas Coroiu on 2023-12-13.
//

import os
import Cocoa
import AuthenticationServices

class CredentialProviderViewController: ASCredentialProviderViewController {
    let logger = Logger();
    
    override func prepareInterfaceForExtensionConfiguration() {
        logger.log("prepareInterfaceForExtensionConfiguration called")
    }
    
    override func prepareInterface(forPasskeyRegistration registrationRequest: ASCredentialRequest) {
        logger.log("prepare interface for registration request \(registrationRequest.description)")
    }
    
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
        logger.log("prepareCredentialList for serviceIdentifiers: \(serviceIdentifiers.count)")
        
        for serviceIdentifier in serviceIdentifiers {
            logger.log("     service: \(serviceIdentifier.identifier)")
        }
    }
}
