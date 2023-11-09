/**
 * Get data from local storage based on the keys provided.
 *
 * @param keys - String or array of strings of keys to get from local storage
 */
async function getFromLocalStorage(keys: string | string[]): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (storage: Record<string, any>) => resolve(storage));
  });
}

/**
 * Sets up a long-lived connection with the extension background
 * and triggers an onDisconnect event if the extension context
 * is invalidated.
 *
 * @param callback - Callback function to run when the extension disconnects
 */
function setupExtensionDisconnectAction(callback: CallableFunction) {
  const port = chrome.runtime.connect({ name: "content-script-extension-connection-port" });
  port.onDisconnect.addListener((port) => callback(port));
}

export { getFromLocalStorage, setupExtensionDisconnectAction };
