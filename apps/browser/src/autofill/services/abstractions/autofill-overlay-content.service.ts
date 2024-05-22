import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { SubFrameOffsetData } from "../../background/abstractions/overlay.background";
import { AutofillExtensionMessageParam } from "../../content/abstractions/autofill-init";
import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

export type OpenAutofillInlineMenuOptions = {
  isFocusingFieldElement?: boolean;
  isOpeningFullAutofillInlineMenu?: boolean;
  authStatus?: AuthenticationStatus;
};

export type AutofillOverlayContentExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  openAutofillInlineMenu: ({ message }: AutofillExtensionMessageParam) => void;
  addNewVaultItemFromOverlay: () => void;
  blurMostRecentlyFocusedField: () => void;
  unsetMostRecentlyFocusedField: () => void;
  bgUnlockPopoutOpened: () => void;
  bgVaultItemRepromptPopoutOpened: () => void;
  redirectAutofillInlineMenuFocusOut: ({ message }: AutofillExtensionMessageParam) => void;
  updateAutofillInlineMenuVisibility: ({ message }: AutofillExtensionMessageParam) => void;
  getSubFrameOffsets: ({ message }: AutofillExtensionMessageParam) => Promise<SubFrameOffsetData>;
  getSubFrameOffsetsFromWindowMessage: ({ message }: AutofillExtensionMessageParam) => void;
};

export interface AutofillOverlayContentService {
  pageDetailsUpdateRequired: boolean;
  extensionMessageHandlers: AutofillOverlayContentExtensionMessageHandlers;
  init(): void;
  setupAutofillInlineMenuListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField,
  ): Promise<void>;
  blurMostRecentlyFocusedField(isRemovingInlineMenu?: boolean): void;
  destroy(): void;
}
