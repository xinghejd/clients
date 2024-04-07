import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

import { SubFrameOffsetData } from "../../background/abstractions/overlay.background";
import { AutofillExtensionMessageParam } from "../../content/abstractions/autofill-init";
import AutofillField from "../../models/autofill-field";
import { ElementWithOpId, FormFieldElement } from "../../types";

export type OpenAutofillOverlayOptions = {
  isFocusingFieldElement?: boolean;
  isOpeningFullOverlay?: boolean;
  authStatus?: AuthenticationStatus;
};

export type AutofillOverlayContentExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  openAutofillOverlay: ({ message }: AutofillExtensionMessageParam) => void;
  addNewVaultItemFromOverlay: () => void;
  blurMostRecentOverlayField: () => void;
  bgUnlockPopoutOpened: () => void;
  bgVaultItemRepromptPopoutOpened: () => void;
  redirectOverlayFocusOut: ({ message }: AutofillExtensionMessageParam) => void;
  updateAutofillOverlayVisibility: ({ message }: AutofillExtensionMessageParam) => void;
  updateIsOverlayCiphersPopulated: ({ message }: AutofillExtensionMessageParam) => void;
  getSubFrameOffsets: ({ message }: AutofillExtensionMessageParam) => Promise<SubFrameOffsetData>;
  getSubFrameOffsetsFromWindowMessage: ({ message }: AutofillExtensionMessageParam) => void;
};

export interface AutofillOverlayContentService {
  // isFieldCurrentlyFocused: boolean;
  // isCurrentlyFilling: boolean;
  isOverlayCiphersPopulated: boolean;
  pageDetailsUpdateRequired: boolean;
  autofillOverlayVisibility: number;
  extensionMessageHandlers: any;
  init(): void;
  setupAutofillOverlayListenerOnField(
    autofillFieldElement: ElementWithOpId<FormFieldElement>,
    autofillFieldData: AutofillField,
  ): Promise<void>;
  openAutofillOverlay(options: OpenAutofillOverlayOptions): void;
  // removeAutofillOverlay(): void;
  // removeAutofillOverlayButton(): void;
  // removeAutofillOverlayList(): void;
  addNewVaultItem(): void;
  focusMostRecentOverlayField(): void;
  blurMostRecentOverlayField(isRemovingOverlay?: boolean): void;
  destroy(): void;
}
