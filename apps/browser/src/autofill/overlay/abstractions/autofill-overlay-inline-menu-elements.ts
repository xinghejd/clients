import { AutofillExtensionMessageParam } from "../../content/abstractions/autofill-init";

export type InlineMenuExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  closeInlineMenu: ({ message }: AutofillExtensionMessageParam) => void;
  appendInlineMenuElementsToDom: ({ message }: AutofillExtensionMessageParam) => Promise<void>;
  toggleInlineMenuHidden: ({ message }: AutofillExtensionMessageParam) => void;
  checkIsAutofillInlineMenuButtonVisible: () => boolean;
  checkIsAutofillInlineMenuListVisible: () => boolean;
};

export interface AutofillOverlayInlineMenuElements {
  extensionMessageHandlers: InlineMenuExtensionMessageHandlers;
  isElementInlineMenu(element: HTMLElement): boolean;
  destroy(): void;
}
