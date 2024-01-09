import { NotificationQueueMessageTypes } from "../../enums/notification-queue-message-type.enum";

interface NotificationQueueMessage {
  type: NotificationQueueMessageTypes;
  domain: string;
  tab: chrome.tabs.Tab;
  expires: Date;
  wasVaultLocked: boolean;
}

interface AddChangePasswordQueueMessage extends NotificationQueueMessage {
  type: "change";
  cipherId: string;
  newPassword: string;
}

interface AddLoginQueueMessage extends NotificationQueueMessage {
  type: "add";
  username: string;
  password: string;
  uri: string;
}

interface AddUnlockVaultQueueMessage extends NotificationQueueMessage {
  type: "unlock";
}

interface AddRequestFilelessImportQueueMessage extends NotificationQueueMessage {
  type: "fileless-import";
  importType?: string;
}

type NotificationQueueMessageItem =
  | AddLoginQueueMessage
  | AddChangePasswordQueueMessage
  | AddUnlockVaultQueueMessage
  | AddRequestFilelessImportQueueMessage;

type LockedVaultPendingNotificationsItem = {
  commandToRetry: {
    msg: {
      command: string;
      data?: any;
    };
    sender: chrome.runtime.MessageSender;
  };
  target: string;
};

type AddLoginRuntimeMessage = {
  username: string;
  password: string;
  url: string;
};

type ChangePasswordRuntimeMessage = {
  currentPassword: string;
  newPassword: string;
  url: string;
};

type NotificationBackgroundExtensionMessage = {
  [key: string]: any;
  command: string;
  data?:
    | {
        height?: number;
      }
    | LockedVaultPendingNotificationsItem
    | ChangePasswordRuntimeMessage;
  login?: AddLoginRuntimeMessage;
};

export {
  AddChangePasswordQueueMessage,
  AddLoginQueueMessage,
  AddUnlockVaultQueueMessage,
  AddRequestFilelessImportQueueMessage,
  NotificationQueueMessageItem,
  LockedVaultPendingNotificationsItem,
  AddLoginRuntimeMessage,
  ChangePasswordRuntimeMessage,
  NotificationBackgroundExtensionMessage,
};
