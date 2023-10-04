// Add chrome storage api
import { mock } from "jest-mock-extended";

const QUOTA_BYTES = 10;
const storage = {
  local: {
    set: jest.fn(),
    get: jest.fn(),
    remove: jest.fn(),
    QUOTA_BYTES,
    getBytesInUse: jest.fn(),
    clear: jest.fn(),
  },
  session: {
    set: jest.fn(),
    get: jest.fn(),
    has: jest.fn(),
    remove: jest.fn(),
  },
};

let runtimeOnMessageCallback: CallableFunction;
const runtime = {
  onMessage: {
    addListener: jest.fn((callback) => (runtimeOnMessageCallback = callback)),
    removeListener: jest.fn((callback) => {
      if (runtimeOnMessageCallback === callback) {
        runtimeOnMessageCallback = undefined;
      }
    }),
    callListener: (
      message: any,
      sender?: chrome.runtime.MessageSender,
      sendResponse?: CallableFunction
    ) => {
      const messageData = message || {};
      const messageSender = sender || mock<chrome.runtime.MessageSender>();
      const sendResponseCallback = sendResponse || jest.fn();
      runtimeOnMessageCallback(messageData, messageSender, sendResponseCallback);
    },
  },
  sendMessage: jest.fn(),
  getManifest: jest.fn(),
  getURL: jest.fn((path) => `chrome-extension://id/${path}`),
  onConnect: {
    addListener: jest.fn(),
  },
  connect: jest.fn((connectInfo: chrome.runtime.ConnectInfo) => {
    let onMessageCallback: CallableFunction;
    let onDisconnectCallback: CallableFunction;

    const port = {
      name: connectInfo.name,
      onDisconnect: {
        addListener: jest.fn((callback) => (onDisconnectCallback = callback)),
        removeListener: jest.fn((callback) => {
          if (onDisconnectCallback === callback) {
            onDisconnectCallback = undefined;
          }
        }),
        callListener: () => onDisconnectCallback(port),
      },
      onMessage: {
        addListener: jest.fn((callback) => (onMessageCallback = callback)),
        removeListener: jest.fn((callback) => {
          if (onMessageCallback === callback) {
            onMessageCallback = undefined;
          }
        }),
        callListener: (message: any) => onMessageCallback(message, port),
      },
      postMessage: jest.fn(),
      disconnect: jest.fn(),
    };
    return port;
  }),
};

const contextMenus = {
  create: jest.fn(),
  removeAll: jest.fn(),
};

const i18n = {
  getMessage: jest.fn(),
  getUILanguage: jest.fn(),
};

const tabs = {
  executeScript: jest.fn(),
  sendMessage: jest.fn(),
  query: jest.fn(),
  remove: jest.fn(),
};

const scripting = {
  executeScript: jest.fn(),
};

const windows = {
  create: jest.fn(),
  get: jest.fn(),
  getCurrent: jest.fn(),
  update: jest.fn(),
};

const port = {
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
  postMessage: jest.fn(),
};

// set chrome
global.chrome = {
  i18n,
  storage,
  runtime,
  contextMenus,
  tabs,
  scripting,
  windows,
  port,
} as any;
