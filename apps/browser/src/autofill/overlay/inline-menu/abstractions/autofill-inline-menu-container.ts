import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { InlineMenuCipherData } from "../../../background/abstractions/overlay.background";

type AutofillInlineMenuContainerMessage = {
  command: string;
  portKey: string;
};

export type InitInlineMenuElementMessage = AutofillInlineMenuContainerMessage & {
  iframeUrl?: string;
  pageTitle?: string;
  authStatus?: AuthenticationStatus;
  styleSheetUrl?: string;
  theme?: string;
  translations?: Record<string, string>;
  ciphers?: InlineMenuCipherData[];
  portName?: string;
};

export type AutofillInlineMenuContainerWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuList: (message: InitInlineMenuElementMessage) => void;
  initAutofillInlineMenuButton: (message: InitInlineMenuElementMessage) => void;
};
