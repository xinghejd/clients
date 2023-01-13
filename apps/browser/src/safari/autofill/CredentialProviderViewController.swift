import AuthenticationServices
import Ipc

class SwiftCallback: Ipc.MessageCallback {
    func message(message: String) {
        // test
    }
}

struct Handshake: Codable {
    var version: Int = 1;
    var messageId: String;
    var command: String = "bw-handshake";
    var payload: HandshakePayload;
}

struct HandshakePayload: Codable {
    
}

class CredentialProviderViewController: ASCredentialProviderViewController {

    var callback: SwiftCallback? = nil
    
    override func viewDidLoad() {
        let fileManager = FileManager.default
        if let directory = fileManager.containerURL(forSecurityApplicationGroupIdentifier: "LTZ2PFU5D6.com.bitwarden.desktop") {
            let newDirectory = directory.appendingPathComponent("socket")
            try? fileManager.createDirectory(at: newDirectory, withIntermediateDirectories: false, attributes: nil)
        }
        
        let callback = SwiftCallback()
        let ipc = IpcClient()
        
        ipc.start(callback: callback)
        
        let m = Handshake(messageId: "1", payload: HandshakePayload())
        
        let jsonEncoder = JSONEncoder()
        let jsonData = try! jsonEncoder.encode(m)
        
        ipc.send(message: String(data: jsonData, encoding: String.Encoding.utf8)!)
    }
    
    /*
     Prepare your UI to list available credentials for the user to choose from. The items in
     'serviceIdentifiers' describe the service the user is logging in to, so your extension can
     prioritize the most relevant credentials in the list.
    */
    override func prepareCredentialList(for serviceIdentifiers: [ASCredentialServiceIdentifier]) {
    }

    /*
     Implement this method if your extension supports showing credentials in the QuickType bar.
     When the user selects a credential from your app, this method will be called with the
     ASPasswordCredentialIdentity your app has previously saved to the ASCredentialIdentityStore.
     Provide the password by completing the extension request with the associated ASPasswordCredential.
     If using the credential would require showing custom UI for authenticating the user, cancel
     the request with error code ASExtensionError.userInteractionRequired.
*/
    override func provideCredentialWithoutUserInteraction(for credentialIdentity: ASPasswordCredentialIdentity) {
        let databaseIsUnlocked = true
        if (databaseIsUnlocked) {
            let passwordCredential = ASPasswordCredential(user: "j_appleseed", password: "apple1234")
            self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
        } else {
            self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code:ASExtensionError.userInteractionRequired.rawValue))
        }
    }

    /*
     Implement this method if provideCredentialWithoutUserInteraction(for:) can fail with
     ASExtensionError.userInteractionRequired. In this case, the system may present your extension's
     UI and call this method. Show appropriate UI for authenticating the user then provide the password
     by completing the extension request with the associated ASPasswordCredential.

    override func prepareInterfaceToProvideCredential(for credentialIdentity: ASPasswordCredentialIdentity) {
    }
    */

    @IBAction func cancel(_ sender: AnyObject?) {
        self.extensionContext.cancelRequest(withError: NSError(domain: ASExtensionErrorDomain, code: ASExtensionError.userCanceled.rawValue))
    }

    @IBAction func passwordSelected(_ sender: AnyObject?) {
        let passwordCredential = ASPasswordCredential(user: "j_appleseed", password: "apple1234")
        self.extensionContext.completeRequest(withSelectedCredential: passwordCredential, completionHandler: nil)
    }

}
