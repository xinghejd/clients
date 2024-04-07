import { AutofillExtensionMessageParam } from "../../content/abstractions/autofill-init";

export type InlineMenuExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  closeInlineMenu: ({ message }: AutofillExtensionMessageParam) => void;
  appendInlineMenuElementsToDom: ({ message }: AutofillExtensionMessageParam) => Promise<void>;
  toggleInlineMenuHidden: ({ message }: AutofillExtensionMessageParam) => void;
  checkIsInlineMenuButtonVisible: () => boolean;
  checkIsInlineMenuListVisible: () => boolean;
};

export interface InlineMenuElements {
  extensionMessageHandlers: InlineMenuExtensionMessageHandlers;
  isElementInlineMenu(element: HTMLElement): boolean;
  destroy(): void;
}
