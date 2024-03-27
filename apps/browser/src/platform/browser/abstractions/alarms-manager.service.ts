export type ActiveAlarm = {
  name: string;
  startTime: number;
  createInfo: chrome.alarms.AlarmCreateInfo;
};

export interface AlarmsManagerService {
  clearAlarm(name: string): Promise<void>;
  setTimeoutAlarm(name: string, callback: CallableFunction, delayInMinutes: number): Promise<void>;
  setIntervalAlarm(
    name: string,
    callback: CallableFunction,
    intervalInMinutes: number,
    initialDelayInMinutes?: number,
  ): Promise<void>;
  clearAllAlarms(): Promise<void>;
}
