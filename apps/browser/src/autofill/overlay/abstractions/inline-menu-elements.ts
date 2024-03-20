import { AutofillExtensionMessageParam } from "../../content/abstractions/autofill-init";

export type InlineMenuExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  closeInlineMenu: ({ message }: AutofillExtensionMessageParam) => void;
  updateInlineMenuElementsPosition: () => Promise<[void, void]>;
  toggleInlineMenuHidden: ({ message }: AutofillExtensionMessageParam) => void;
};

export interface InlineMenuElements {
  extensionMessageHandlers: InlineMenuExtensionMessageHandlers;
}
