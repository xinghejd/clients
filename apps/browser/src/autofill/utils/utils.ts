async function getFromLocalStorage(keys: string | string[]): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (storage: Record<string, any>) => resolve(storage));
  });
}

function setupExtensionDisconnectAction(callback: CallableFunction) {
  const port = chrome.runtime.connect({ name: "content-script-extension-connection-port" });
  port.onDisconnect.addListener((port) => callback(port));
}

export { getFromLocalStorage, setupExtensionDisconnectAction };
