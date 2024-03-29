export const AlarmNames = {
  clearClipboardTimeout: "clearClipboardTimeout",
  systemClearClipboardTimeout: "systemClearClipboardTimeout",
  scheduleNextSyncTimeout: "scheduleNextSyncTimeout",
  loginStrategySessionTimeout: "loginStrategySessionTimeout",
  notificationsReconnectTimeout: "notificationsReconnectTimeout",
  fido2ClientAbortTimeout: "fido2ClientAbortTimeout",
  eventUploadsInterval: "eventUploadsInterval",
} as const;

export type AlarmName = (typeof AlarmNames)[keyof typeof AlarmNames];

export type ActiveAlarm = {
  name: AlarmName;
  startTime: number;
  createInfo: chrome.alarms.AlarmCreateInfo;
};

export interface AlarmsManagerService {
  clearAlarm(name: AlarmName): Promise<void>;
  setTimeoutAlarm(
    name: AlarmName,
    callback: CallableFunction,
    delayInMinutes: number,
  ): Promise<void>;
  setIntervalAlarm(
    name: AlarmName,
    callback: CallableFunction,
    intervalInMinutes: number,
    initialDelayInMinutes?: number,
  ): Promise<void>;
  clearAllAlarms(): Promise<void>;
}
