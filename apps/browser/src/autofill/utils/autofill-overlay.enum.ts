const AutofillOverlayElement = {
  Button: "autofill-overlay-button",
  List: "autofill-overlay-list",
} as const;

const AutofillOverlayPort = {
  Button: "autofill-overlay-button-port",
  ButtonMessageConnector: "autofill-overlay-button-message-connector",
  List: "autofill-overlay-list-port",
  ListMessageConnector: "autofill-overlay-list-message-connector",
} as const;

const RedirectFocusDirection = {
  Current: "current",
  Previous: "previous",
  Next: "next",
} as const;

export { AutofillOverlayElement, AutofillOverlayPort, RedirectFocusDirection };
