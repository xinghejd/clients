import { AutofillInlineMenuButtonWindowMessageHandlers } from "./autofill-inline-menu-button";
import { OverlayListWindowMessageHandlers } from "./autofill-inline-menu-list";

type AutofillInlineMenuPageElementWindowMessageHandlers =
  | AutofillInlineMenuButtonWindowMessageHandlers
  | OverlayListWindowMessageHandlers;

type AutofillInlineMenuPageElementWindowMessage = {
  [key: string]: any;
  command: string;
  overlayCipherId?: string;
  height?: number;
};

export {
  AutofillInlineMenuPageElementWindowMessageHandlers,
  AutofillInlineMenuPageElementWindowMessage,
};
