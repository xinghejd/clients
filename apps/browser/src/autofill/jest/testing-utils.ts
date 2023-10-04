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
  if (!(chrome.runtime.onMessage as any).callListener) {
    throw new Error(
      'The "callListener" method mock is not defined on the "onMessage" mock of the "runtime" object.'
    );
  }

  (chrome.runtime.onMessage as any).callListener(message, sender, sendResponse);
}

export { triggerTestFailure, flushPromises, postWindowMessage, sendExtensionRuntimeMessage };
