/* eslint-disable no-console */
export function initWebAuthnTestScript() {
  (window as any).testWebauthnLogin = async () => {
    function isArrayBuffer(bufferSource: BufferSource): bufferSource is ArrayBuffer {
      return bufferSource instanceof ArrayBuffer || bufferSource.buffer === undefined;
    }

    function bufferSourceToUint8Array(bufferSource: BufferSource) {
      if (isArrayBuffer(bufferSource)) {
        return new Uint8Array(bufferSource);
      } else {
        return new Uint8Array(bufferSource.buffer);
      }
    }

    // function base64Decode(base64: string): Uint8Array {
    //   const rawData = atob(base64);
    //   const buffer = new Uint8Array(rawData.length);
    //   for (let i = 0; i < rawData.length; ++i) {
    //     buffer[i] = rawData.charCodeAt(i);
    //   }
    //   return buffer;
    // }

    function base64UrlDecode(base64Url: string): Uint8Array {
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const rawData = atob(base64);
      const buffer = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        buffer[i] = rawData.charCodeAt(i);
      }
      return buffer;
    }

    // function base64Encode(buffer: BufferSource): string {
    //   const data = bufferSourceToUint8Array(buffer);
    //   return btoa(String.fromCharCode.apply(null, data));
    // }

    function base64UrlEncode(buffer: BufferSource): string {
      const data = bufferSourceToUint8Array(buffer);
      const base64 = btoa(String.fromCharCode.apply(null, data));
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }

    const assertionOptionsResponse = await fetch("/identity/accounts/webauthn/assertion-options", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const data = await assertionOptionsResponse.json();
    const publicKey = {
      ...data.options,
      challenge: base64UrlDecode(data.options.challenge),
    };

    const credential = await navigator.credentials.get({
      publicKey,
    });

    console.log("Authenticator response: ", credential);

    const credentialResponse = credential as PublicKeyCredential;
    const deviceResponse = credentialResponse.response as AuthenticatorAssertionResponse;
    const request = {
      id: credentialResponse.id,
      rawId: base64UrlEncode(credentialResponse.rawId),
      type: credentialResponse.type,
      response: {
        authenticatorData: base64UrlEncode(deviceResponse.authenticatorData),
        clientDataJSON: base64UrlEncode(deviceResponse.clientDataJSON),
        signature: base64UrlEncode(deviceResponse.signature),
        userHandle: base64UrlEncode(deviceResponse.userHandle),
      },
    };

    fetchTokenUsingXMLHttpRequest(request, data.token);

    // For some reason `fetch` doesn't work here, so we use XMLHttpRequest instead
    // const requestBody = new URLSearchParams({
    //   scope: "api offline_access",
    //   client_id: "web",
    //   deviceType: "9",
    //   deviceIdentifier: "b589f196-0684-4aad-81fb-2023d6702d15",
    //   deviceName: "chrome",
    //   grant_type: "webauthn",
    //   deviceResponse: JSON.stringify(request),
    //   token: data.token,
    // }).toString();

    // const tokenResponse = await fetch("/identity/connect/token", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //     Accept: "application/json",
    //     "device-type": "9",
    //     "Bitwarden-Client-Name": "web",
    //     "Bitwarden-Client-Version": "2023.10.0",
    //   },
    //   credentials: "include",
    //   cache: "no-store",
    //   body: requestBody,
    // });

    // console.log("Token response", tokenResponse);
    // console.log(data2);
  };

  function fetchTokenUsingXMLHttpRequest(request: object, token: string) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/identity/connect/token", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("device-type", "9");
    xhr.setRequestHeader("Bitwarden-Client-Name", "web");
    xhr.setRequestHeader("Bitwarden-Client-Version", "2023.10.0");
    xhr.withCredentials = true;
    xhr.onload = function () {
      console.log(xhr.responseText);
    };
    xhr.send(
      new URLSearchParams({
        scope: "api offline_access",
        client_id: "web",
        deviceType: "9",
        deviceIdentifier: "b589f196-0684-4aad-81fb-2023d6702d15",
        deviceName: "chrome",
        grant_type: "webauthn",
        deviceResponse: JSON.stringify(request),
        token,
      }).toString()
    );
  }
}
