import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayCipherData } from "../../../background/abstractions/overlay.background";

type AutofillInlineMenuMenuContainerMessage = {
  command: string;
  portKey: string;
};

export type InitInlineMenuElementMessage = AutofillInlineMenuMenuContainerMessage & {
  iframeUrl?: string;
  pageTitle?: string;
  authStatus?: AuthenticationStatus;
  styleSheetUrl?: string;
  theme?: string;
  translations?: Record<string, string>;
  ciphers?: OverlayCipherData[];
  portName?: string;
};

export type AutofillInlineMenuMenuContainerWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuList: (message: InitInlineMenuElementMessage) => void;
  initAutofillInlineMenuButton: (message: InitInlineMenuElementMessage) => void;
};
