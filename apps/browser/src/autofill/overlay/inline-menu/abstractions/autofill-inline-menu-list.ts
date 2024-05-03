import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { OverlayCipherData } from "../../../background/abstractions/overlay.background";

type OverlayListMessage = { command: string };

type UpdateOverlayListCiphersMessage = OverlayListMessage & {
  ciphers: OverlayCipherData[];
};

type InitAutofillOverlayListMessage = OverlayListMessage & {
  authStatus: AuthenticationStatus;
  styleSheetUrl: string;
  theme: string;
  translations: Record<string, string>;
  ciphers?: OverlayCipherData[];
  portKey: string;
};

type OverlayListWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuList: ({ message }: { message: InitAutofillOverlayListMessage }) => void;
  checkAutofillInlineMenuListFocused: () => void;
  updateOverlayListCiphers: ({ message }: { message: UpdateOverlayListCiphersMessage }) => void;
  focusInlineMenuList: () => void;
};

export {
  UpdateOverlayListCiphersMessage,
  InitAutofillOverlayListMessage,
  OverlayListWindowMessageHandlers,
};
