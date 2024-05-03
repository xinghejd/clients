import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type OverlayButtonMessage = { command: string; colorScheme?: string };

type UpdateAuthStatusMessage = OverlayButtonMessage & { authStatus: AuthenticationStatus };

type InitAutofillOverlayButtonMessage = UpdateAuthStatusMessage & {
  styleSheetUrl: string;
  translations: Record<string, string>;
  portKey: string;
};

type OverlayButtonWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuButton: ({
    message,
  }: {
    message: InitAutofillOverlayButtonMessage;
  }) => void;
  checkAutofillInlineMenuButtonFocused: () => void;
  updateAutofillOverlayButtonAuthStatus: ({
    message,
  }: {
    message: UpdateAuthStatusMessage;
  }) => void;
  updateAutofillInlineMenuColorScheme: ({ message }: { message: OverlayButtonMessage }) => void;
};

export {
  UpdateAuthStatusMessage,
  OverlayButtonMessage,
  InitAutofillOverlayButtonMessage,
  OverlayButtonWindowMessageHandlers,
};
