import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

type AutofillInlineMenuButtonMessage = { command: string; colorScheme?: string };

type UpdateAuthStatusMessage = AutofillInlineMenuButtonMessage & {
  authStatus: AuthenticationStatus;
};

type InitAutofillInlineMenuButtonMessage = UpdateAuthStatusMessage & {
  styleSheetUrl: string;
  translations: Record<string, string>;
  portKey: string;
};

type AutofillInlineMenuButtonWindowMessageHandlers = {
  [key: string]: CallableFunction;
  initAutofillInlineMenuButton: ({
    message,
  }: {
    message: InitAutofillInlineMenuButtonMessage;
  }) => void;
  checkAutofillInlineMenuButtonFocused: () => void;
  updateAutofillInlineMenuButtonAuthStatus: ({
    message,
  }: {
    message: UpdateAuthStatusMessage;
  }) => void;
  updateAutofillInlineMenuColorScheme: ({
    message,
  }: {
    message: AutofillInlineMenuButtonMessage;
  }) => void;
};

export {
  UpdateAuthStatusMessage,
  AutofillInlineMenuButtonMessage,
  InitAutofillInlineMenuButtonMessage,
  AutofillInlineMenuButtonWindowMessageHandlers,
};
