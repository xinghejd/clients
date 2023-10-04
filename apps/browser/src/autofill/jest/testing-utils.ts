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

export { triggerTestFailure, flushPromises, postWindowMessage };
