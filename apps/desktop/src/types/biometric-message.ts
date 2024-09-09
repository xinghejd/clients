export enum BiometricAction {
  EnabledForUser = "enabled",
  Authenticate = "authenticate",
  Setup = "setup",
  GetStatus = "status",
  GetStatusForUser = "statusForUser",
}

export type BiometricMessage = {
  action: BiometricAction;
  keySuffix?: string;
  key?: string;
  userId?: string;
};
