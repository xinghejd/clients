type PortSpy = chrome.runtime.Port & {
  onDisconnect: { callListener: () => void };
  onMessage: { callListener: (message: any) => void };
};

export { PortSpy };
