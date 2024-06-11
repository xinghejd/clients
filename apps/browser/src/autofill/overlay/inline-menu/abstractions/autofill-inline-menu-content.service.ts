import { AutofillExtensionMessageParam } from "../../../content/abstractions/autofill-init";

export type InlineMenuExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  closeAutofillInlineMenu: ({ message }: AutofillExtensionMessageParam) => void;
  appendAutofillInlineMenuToDom: ({ message }: AutofillExtensionMessageParam) => Promise<void>;
  toggleAutofillInlineMenuHidden: ({ message }: AutofillExtensionMessageParam) => void;
  checkIsAutofillInlineMenuButtonVisible: () => boolean;
  checkIsAutofillInlineMenuListVisible: () => boolean;
};

export interface AutofillInlineMenuContentService {
  messageHandlers: InlineMenuExtensionMessageHandlers;
  isElementInlineMenu(element: HTMLElement): boolean;
  destroy(): void;
}
