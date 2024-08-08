import { NotificationMessageTypes } from "../../enums/notification-queue-message-type.enum";

export type OverlayNotification = {
  type: NotificationMessageTypes;
  tab: chrome.tabs.Tab;
  expires: Date;
};

export type AddLoginCipherData = { username: string; password: string };

export type AddLoginCipherNotification = OverlayNotification &
  AddLoginCipherData & {
    uri: string;
  };

export type UpdateLoginCipherData = { currentPassword: string; newPassword: string };

export type UpdateLoginCipherNotification = OverlayNotification &
  UpdateLoginCipherData & {
    uri: string;
    cipherId: string;
  };

export type OverlayNotificationItem = AddLoginCipherNotification | UpdateLoginCipherNotification;

export type OverlayNotifications = Map<chrome.tabs.Tab["id"], OverlayNotificationItem>;

export type ActiveFormSubmissionRequests = Set<chrome.webRequest.ResourceRequest["requestId"]>;

export type ModifyLoginCipherFormData = Map<
  chrome.tabs.Tab["id"],
  { uri: string; addLogin: AddLoginCipherData; updateLogin: UpdateLoginCipherData }
>;

export type OverlayNotificationsExtensionMessage = {
  command: string;
};

type OverlayNotificationsMessageParams = { message: OverlayNotificationsExtensionMessage };
type OverlayNotificationSenderParams = { sender: chrome.runtime.MessageSender };
type OverlayNotificationsMessageHandlersParams = OverlayNotificationsMessageParams &
  OverlayNotificationSenderParams;

export type OverlayNotificationsExtensionMessageHandlers = {
  [key: string]: ({ message, sender }: OverlayNotificationsMessageHandlersParams) => Promise<any>;
};

export interface OverlayNotificationsBackground {
  init(): void;
}
