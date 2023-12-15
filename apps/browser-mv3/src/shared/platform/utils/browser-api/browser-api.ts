function addRuntimeOnMessageListener(
  callback: (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => void,
) {
  if (!chrome.runtime.onMessage.hasListener(callback)) {
    chrome.runtime.onMessage.addListener(callback);
  }
}

function removeRuntimeOnMessageListener(
  callback: (
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void,
  ) => void,
) {
  if (chrome.runtime.onMessage.hasListener(callback)) {
    chrome.runtime.onMessage.removeListener(callback);
  }
}

export { addRuntimeOnMessageListener, removeRuntimeOnMessageListener };
