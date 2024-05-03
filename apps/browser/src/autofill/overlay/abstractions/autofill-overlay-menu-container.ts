import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayCipherData } from "../../background/abstractions/overlay.background";

type AutofillOverlayMenuContainerMessage = {
  command: string;
  portKey: string;
};

export type InitOverlayElementMessage = AutofillOverlayMenuContainerMessage & {
  iframeUrl?: string;
  pageTitle?: string;
  authStatus?: AuthenticationStatus;
  styleSheetUrl?: string;
  theme?: string;
  translations?: Record<string, string>;
  ciphers?: OverlayCipherData[];
  portName?: string;
};

export type AutofillOverlayMenuContainerWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuList: (message: InitOverlayElementMessage) => void;
  initAutofillInlineMenuButton: (message: InitOverlayElementMessage) => void;
};
