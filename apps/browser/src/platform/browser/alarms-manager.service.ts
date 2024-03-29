import { firstValueFrom, map, Observable } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  ALARMS_DISK,
  GlobalState,
  KeyDefinition,
  StateProvider,
} from "@bitwarden/common/platform/state";

import {
  ActiveAlarm,
  AlarmName,
  AlarmsManagerService as AlarmsManagerServiceInterface,
} from "./abstractions/alarms-manager.service";
import { BrowserApi } from "./browser-api";

const ACTIVE_ALARMS = new KeyDefinition(ALARMS_DISK, "activeAlarms", {
  deserializer: (value: ActiveAlarm[]) => value ?? [],
});

export class AlarmsManagerService implements AlarmsManagerServiceInterface {
  private activeAlarmsState: GlobalState<ActiveAlarm[]>;
  readonly activeAlarms$: Observable<ActiveAlarm[]>;
  private recoveredAlarms: Set<string> = new Set();
  private onAlarmHandlers: Record<string, () => void> = {};

  constructor(
    private logService: LogService,
    private stateProvider: StateProvider,
  ) {
    this.activeAlarmsState = this.stateProvider.getGlobal(ACTIVE_ALARMS);
    this.activeAlarms$ = this.activeAlarmsState.state$.pipe(
      map((activeAlarms) => activeAlarms ?? []),
    );

    this.setupOnAlarmListener();
    this.verifyAlarmsState().catch((e) => this.logService.error(e));
  }

  /**
   * Sets an alarm that will trigger once after a specified delay.
   *
   * @param name - The name of the alarm.
   * @param callback - The function to call when the alarm triggers.
   * @param delayInMinutes - The delay in minutes before the alarm triggers.
   */
  async setTimeoutAlarm(
    name: AlarmName,
    callback: CallableFunction,
    delayInMinutes: number,
  ): Promise<void> {
    if (delayInMinutes < 1) {
      throw new Error(
        "setTimeoutAlarm delay must be at least 1 minute. Use globalThis.setTimeout for shorter delays.",
      );
    }

    this.registerAlarmHandler(name, callback);
    if (this.recoveredAlarms.has(name)) {
      await this.triggerRecoveredAlarm(name);
      return;
    }

    await this.createAlarm(name, { delayInMinutes });
  }

  async setIntervalAlarm(
    name: AlarmName,
    callback: CallableFunction,
    intervalInMinutes: number,
    initialDelayInMinutes?: number,
  ): Promise<void> {
    if (intervalInMinutes < 1) {
      throw new Error(
        "setIntervalAlarm interval must be at least 1 minute. Use globalThis.setInterval for shorter intervals.",
      );
    }

    this.registerAlarmHandler(name, callback);
    if (this.recoveredAlarms.has(name)) {
      await this.triggerRecoveredAlarm(name);
    }

    await this.createAlarm(name, {
      periodInMinutes: intervalInMinutes,
      delayInMinutes: initialDelayInMinutes ?? intervalInMinutes,
    });
  }

  async clearAlarm(name: AlarmName): Promise<void> {
    const wasCleared = await BrowserApi.clearAlarm(name);
    if (wasCleared) {
      await this.deleteActiveAlarm(name);
      this.recoveredAlarms.delete(name);
    }
  }

  async clearAllAlarms(): Promise<void> {
    await BrowserApi.clearAllAlarms();
    await this.updateActiveAlarms([]);
    this.onAlarmHandlers = {};
    this.recoveredAlarms.clear();
  }

  private async createAlarm(
    name: AlarmName,
    createInfo: chrome.alarms.AlarmCreateInfo,
  ): Promise<void> {
    const existingAlarm = await BrowserApi.getAlarm(name);
    if (existingAlarm) {
      this.logService.debug(`Alarm ${name} already exists. Skipping creation.`);
      return;
    }

    await BrowserApi.createAlarm(name, createInfo);
    await this.setActiveAlarm({ name, startTime: Date.now(), createInfo });
  }

  private registerAlarmHandler(name: AlarmName, handler: CallableFunction): void {
    if (this.onAlarmHandlers[name]) {
      this.logService.warning(`Alarm handler for ${name} already exists. Overwriting.`);
    }

    this.onAlarmHandlers[name] = () => handler();
  }

  private async verifyAlarmsState(): Promise<void> {
    const currentTime = Date.now();
    const activeAlarms = await firstValueFrom(this.activeAlarms$);

    for (const alarm of activeAlarms) {
      const { name, startTime, createInfo } = alarm;
      const existingAlarm = await BrowserApi.getAlarm(name);
      if (existingAlarm) {
        continue;
      }

      if (
        (createInfo.when && createInfo.when < currentTime) ||
        (!createInfo.periodInMinutes &&
          createInfo.delayInMinutes &&
          startTime + createInfo.delayInMinutes * 60 * 1000 < currentTime)
      ) {
        this.recoveredAlarms.add(name);
        continue;
      }

      void this.createAlarm(name, createInfo);
    }

    // 10 seconds after verifying the alarm state, we should treat any newly created alarms as non-recovered alarms.
    setTimeout(() => this.recoveredAlarms.clear(), 10 * 1000);
  }

  private async setActiveAlarm(alarm: ActiveAlarm): Promise<void> {
    const activeAlarms = await firstValueFrom(this.activeAlarms$);
    activeAlarms.push(alarm);
    await this.updateActiveAlarms(activeAlarms);
  }

  private async deleteActiveAlarm(name: AlarmName): Promise<void> {
    const activeAlarms = await firstValueFrom(this.activeAlarms$);
    const filteredAlarms = activeAlarms.filter((alarm) => alarm.name !== name);
    await this.updateActiveAlarms(filteredAlarms);
    delete this.onAlarmHandlers[name];
  }

  private async updateActiveAlarms(alarms: ActiveAlarm[]): Promise<void> {
    await this.activeAlarmsState.update(() => alarms);
  }

  private async triggerRecoveredAlarm(name: AlarmName): Promise<void> {
    this.recoveredAlarms.delete(name);
    await this.triggerAlarm(name);
  }

  private setupOnAlarmListener(): void {
    BrowserApi.addListener(chrome.alarms.onAlarm, this.handleOnAlarm);
  }

  private handleOnAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
    await this.triggerAlarm(alarm.name as AlarmName);
  };

  private async triggerAlarm(name: AlarmName): Promise<void> {
    const handler = this.onAlarmHandlers[name];
    if (handler) {
      handler();
    }

    const alarm = await BrowserApi.getAlarm(name);
    if (alarm?.periodInMinutes) {
      return;
    }

    await this.deleteActiveAlarm(name);
  }
}
