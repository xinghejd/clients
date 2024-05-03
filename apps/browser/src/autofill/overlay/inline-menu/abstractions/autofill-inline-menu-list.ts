import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayCipherData } from "../../../background/abstractions/overlay.background";

type AutofillInlineMenuListMessage = { command: string };

export type UpdateAutofillInlineMenuListCiphersMessage = AutofillInlineMenuListMessage & {
  ciphers: OverlayCipherData[];
};

export type InitAutofillInlineMenuListMessage = AutofillInlineMenuListMessage & {
  authStatus: AuthenticationStatus;
  styleSheetUrl: string;
  theme: string;
  translations: Record<string, string>;
  ciphers?: OverlayCipherData[];
  portKey: string;
};

export type AutofillInlineMenuListWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuList: ({ message }: { message: InitAutofillInlineMenuListMessage }) => void;
  checkAutofillInlineMenuListFocused: () => void;
  updateAutofillInlineMenuListCiphers: ({
    message,
  }: {
    message: UpdateAutofillInlineMenuListCiphersMessage;
  }) => void;
  focusInlineMenuList: () => void;
};
