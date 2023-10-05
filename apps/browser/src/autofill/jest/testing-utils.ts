function triggerTestFailure() {
  expect(true).toBe("Test has failed.");
}

const scheduler = typeof setImmediate === "function" ? setImmediate : setTimeout;
function flushPromises() {
  return new Promise(function (resolve) {
    scheduler(resolve);
  });
}

function postWindowMessage(data: any, origin = "https://localhost/") {
  globalThis.dispatchEvent(new MessageEvent("message", { data, origin }));
}

function sendExtensionRuntimeMessage(
  message: any,
  sender?: chrome.runtime.MessageSender,
  sendResponse?: CallableFunction
) {
  const onMessageMock = chrome.runtime.onMessage as any;
  if (onMessageMock.callListener) {
    onMessageMock.callListener(message, sender, sendResponse);
  }
}

function triggerWindowOnFocusedChangedEvent(windowId: number) {
  const onFocusChangedMock = chrome.windows.onFocusChanged as any;
  if (onFocusChangedMock.callListener) {
    onFocusChangedMock.callListener(windowId);
  }
}

function triggerTabOnActivatedEvent(activeInfo: chrome.tabs.TabActiveInfo) {
  const onActivatedMock = chrome.tabs.onActivated as any;
  if (onActivatedMock.callListener) {
    onActivatedMock.callListener(activeInfo);
  }
}

function triggerTabOnReplacedEvent(addedTabId: number, removedTabId: number) {
  const onReplacedMock = chrome.tabs.onReplaced as any;
  if (onReplacedMock.callListener) {
    onReplacedMock.callListener(addedTabId, removedTabId);
  }
}

function triggerTabOnUpdatedEvent(
  tabId: number,
  changeInfo: chrome.tabs.TabChangeInfo,
  tab: chrome.tabs.Tab
) {
  const onUpdatedMock = chrome.tabs.onUpdated as any;
  if (onUpdatedMock.callListener) {
    onUpdatedMock.callListener(tabId, changeInfo, tab);
  }
}

function triggerTabOnRemovedEvent(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) {
  const onRemovedMock = chrome.tabs.onRemoved as any;
  if (onRemovedMock.callListener) {
    onRemovedMock.callListener(tabId, removeInfo);
  }
}

export {
  triggerTestFailure,
  flushPromises,
  postWindowMessage,
  sendExtensionRuntimeMessage,
  triggerWindowOnFocusedChangedEvent,
  triggerTabOnActivatedEvent,
  triggerTabOnReplacedEvent,
  triggerTabOnUpdatedEvent,
  triggerTabOnRemovedEvent,
};
