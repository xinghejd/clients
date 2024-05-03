const AutofillOverlayElement = {
  Button: "autofill-inline-menu-button",
  List: "autofill-inline-menu-list",
} as const;

const AutofillOverlayPort = {
  Button: "autofill-inline-menu-button-port",
  ButtonMessageConnector: "autofill-inline-menu-button-message-connector",
  List: "autofill-inline-menu-list-port",
  ListMessageConnector: "autofill-inline-menu-list-message-connector",
} as const;

const RedirectFocusDirection = {
  Current: "current",
  Previous: "previous",
  Next: "next",
} as const;

export { AutofillOverlayElement, AutofillOverlayPort, RedirectFocusDirection };
