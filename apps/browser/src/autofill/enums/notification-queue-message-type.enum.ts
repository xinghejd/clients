export const NotificationMessageType = {
  AddLogin: "add",
  ChangePassword: "change",
  UnlockVault: "unlock",
  RequestFilelessImport: "fileless-import",
} as const;

export type NotificationMessageTypes =
  (typeof NotificationMessageType)[keyof typeof NotificationMessageType];
