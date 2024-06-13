import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherRepromptType } from "@bitwarden/common/vault/enums/cipher-reprompt-type";

import AutofillPageDetails from "../../models/autofill-page-details";
import { PageDetail } from "../../services/abstractions/autofill.service";

import { LockedVaultPendingNotificationsData } from "./notification.background";

export type PageDetailsForTab = Record<
  chrome.runtime.MessageSender["tab"]["id"],
  Map<chrome.runtime.MessageSender["frameId"], PageDetail>
>;

export type SubFrameOffsetData = {
  top: number;
  left: number;
  url?: string;
  frameId?: number;
  parentFrameIds?: number[];
} | null;

export type SubFrameOffsetsForTab = Record<
  chrome.runtime.MessageSender["tab"]["id"],
  Map<chrome.runtime.MessageSender["frameId"], SubFrameOffsetData>
>;

export type WebsiteIconData = {
  imageEnabled: boolean;
  image: string;
  fallbackImage: string;
  icon: string;
};

export type FocusedFieldData = {
  focusedFieldStyles: Partial<CSSStyleDeclaration>;
  focusedFieldRects: Partial<DOMRect>;
  tabId?: number;
  frameId?: number;
};

export type InlineMenuElementPosition = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type InlineMenuPosition = {
  button?: InlineMenuElementPosition;
  list?: InlineMenuElementPosition;
};

export type OverlayAddNewItemMessage = {
  login?: {
    uri?: string;
    hostname: string;
    username: string;
    password: string;
  };
};

export type CloseInlineMenuMessage = {
  forceCloseInlineMenu?: boolean;
  overlayElement?: string;
};

export type OverlayBackgroundExtensionMessage = {
  command: string;
  portKey?: string;
  tab?: chrome.tabs.Tab;
  sender?: string;
  details?: AutofillPageDetails;
  isInlineMenuHidden?: boolean;
  setTransparentInlineMenu?: boolean;
  isFieldCurrentlyFocused?: boolean;
  isFieldCurrentlyFilling?: boolean;
  subFrameData?: SubFrameOffsetData;
  focusedFieldData?: FocusedFieldData;
  styles?: Partial<CSSStyleDeclaration>;
  data?: LockedVaultPendingNotificationsData;
} & OverlayAddNewItemMessage &
  CloseInlineMenuMessage;

export type OverlayPortMessage = {
  [key: string]: any;
  command: string;
  direction?: string;
  inlineMenuCipherId?: string;
};

export type InlineMenuCipherData = {
  id: string;
  name: string;
  type: CipherType;
  reprompt: CipherRepromptType;
  favorite: boolean;
  icon: WebsiteIconData;
  login?: { username: string };
  card?: string;
};

export type BackgroundMessageParam = {
  message: OverlayBackgroundExtensionMessage;
};
export type BackgroundSenderParam = {
  sender: chrome.runtime.MessageSender;
};
export type BackgroundOnMessageHandlerParams = BackgroundMessageParam & BackgroundSenderParam;

export type OverlayBackgroundExtensionMessageHandlers = {
  [key: string]: CallableFunction;
  autofillOverlayElementClosed: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  autofillOverlayAddNewVaultItem: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  checkIsInlineMenuCiphersPopulated: ({ sender }: BackgroundSenderParam) => void;
  updateFocusedFieldData: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  updateIsFieldCurrentlyFocused: ({ message }: BackgroundMessageParam) => void;
  checkIsFieldCurrentlyFocused: () => boolean;
  updateIsFieldCurrentlyFilling: ({ message }: BackgroundMessageParam) => void;
  checkIsFieldCurrentlyFilling: () => boolean;
  getAutofillInlineMenuVisibility: () => void;
  openAutofillInlineMenu: () => void;
  closeAutofillInlineMenu: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  checkAutofillInlineMenuFocused: () => void;
  focusAutofillInlineMenuList: () => void;
  updateAutofillInlineMenuPosition: ({
    message,
    sender,
  }: BackgroundOnMessageHandlerParams) => Promise<void>;
  getAutofillInlineMenuPosition: () => InlineMenuPosition;
  toggleAutofillInlineMenuHidden: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  checkIsAutofillInlineMenuButtonVisible: ({ sender }: BackgroundSenderParam) => void;
  checkIsAutofillInlineMenuListVisible: ({ sender }: BackgroundSenderParam) => void;
  checkShouldRepositionInlineMenu: ({ sender }: BackgroundSenderParam) => boolean;
  getCurrentTabFrameId: ({ sender }: BackgroundSenderParam) => number;
  updateSubFrameData: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  rebuildSubFrameOffsets: ({ sender }: BackgroundSenderParam) => void;
  destroyAutofillInlineMenuListeners: ({
    message,
    sender,
  }: BackgroundOnMessageHandlerParams) => void;
  collectPageDetailsResponse: ({ message, sender }: BackgroundOnMessageHandlerParams) => void;
  unlockCompleted: ({ message }: BackgroundMessageParam) => void;
  addedCipher: () => void;
  addEditCipherSubmitted: () => void;
  editedCipher: () => void;
  deletedCipher: () => void;
};

export type PortMessageParam = {
  message: OverlayPortMessage;
};
export type PortConnectionParam = {
  port: chrome.runtime.Port;
};
export type PortOnMessageHandlerParams = PortMessageParam & PortConnectionParam;

export type InlineMenuButtonPortMessageHandlers = {
  [key: string]: CallableFunction;
  triggerDelayedAutofillInlineMenuClosure: ({ port }: PortConnectionParam) => void;
  autofillInlineMenuButtonClicked: ({ port }: PortConnectionParam) => void;
  autofillInlineMenuBlurred: () => void;
  redirectAutofillInlineMenuFocusOut: ({ message, port }: PortOnMessageHandlerParams) => void;
  updateAutofillInlineMenuColorScheme: () => void;
};

export type InlineMenuListPortMessageHandlers = {
  [key: string]: CallableFunction;
  checkAutofillInlineMenuButtonFocused: () => void;
  autofillInlineMenuBlurred: () => void;
  unlockVault: ({ port }: PortConnectionParam) => void;
  fillAutofillInlineMenuCipher: ({ message, port }: PortOnMessageHandlerParams) => void;
  addNewVaultItem: ({ port }: PortConnectionParam) => void;
  viewSelectedCipher: ({ message, port }: PortOnMessageHandlerParams) => void;
  redirectAutofillInlineMenuFocusOut: ({ message, port }: PortOnMessageHandlerParams) => void;
  updateAutofillInlineMenuListHeight: ({ message, port }: PortOnMessageHandlerParams) => void;
};

export interface OverlayBackground {
  init(): Promise<void>;
  removePageDetails(tabId: number): void;
  updateInlineMenuCiphers(): void;
}
