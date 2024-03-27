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
    void this.verifyAlarmsState();
  }

  async clearAlarm(name: string): Promise<void> {
    const wasCleared = await BrowserApi.clearAlarm(name);

    if (wasCleared) {
      await this.deleteActiveAlarm(name);
      delete this.onAlarmHandlers[name];
    }
  }

  async setTimeoutAlarm(
    name: string,
    callback: CallableFunction,
    delayInMinutes: number,
  ): Promise<void> {
    this.registerAlarmHandler(name, callback);
    if (this.recoveredAlarms.has(name)) {
      await this.triggerRecoveredAlarm(name);
      return;
    }

    await this.createAlarm(name, { delayInMinutes });
  }

  async setIntervalAlarm(
    name: string,
    callback: CallableFunction,
    intervalInMinutes: number,
    initialDelayInMinutes?: number,
  ): Promise<void> {
    this.registerAlarmHandler(name, callback);
    if (this.recoveredAlarms.has(name)) {
      await this.triggerRecoveredAlarm(name);
    }

    await this.createAlarm(name, {
      periodInMinutes: intervalInMinutes,
      delayInMinutes: initialDelayInMinutes ?? intervalInMinutes,
    });
  }

  async clearAllAlarms(): Promise<void> {
    await chrome.alarms.clearAll();
    await this.updateActiveAlarms([]);
    this.onAlarmHandlers = {};
  }

  private async triggerRecoveredAlarm(name: string): Promise<void> {
    this.recoveredAlarms.delete(name);
    await this.triggerAlarm(name);
  }

  private async createAlarm(
    name: string,
    createInfo: chrome.alarms.AlarmCreateInfo,
  ): Promise<void> {
    const existingAlarm = await BrowserApi.getAlarm(name);
    if (existingAlarm) {
      return;
    }

    await this.deleteActiveAlarm(name);
    await chrome.alarms.create(name, createInfo);
    await this.setActiveAlarm({ name, startTime: Date.now(), createInfo });
  }

  private registerAlarmHandler(name: string, handler: CallableFunction): void {
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
  }

  private async setActiveAlarm(alarm: ActiveAlarm): Promise<void> {
    const activeAlarms = await firstValueFrom(this.activeAlarms$);
    activeAlarms.push(alarm);
    await this.updateActiveAlarms(activeAlarms);
  }

  private async deleteActiveAlarm(name: string): Promise<void> {
    const activeAlarms = await firstValueFrom(this.activeAlarms$);
    const filteredAlarms = activeAlarms.filter((alarm) => alarm.name !== name);
    await this.updateActiveAlarms(filteredAlarms);
  }

  private async updateActiveAlarms(alarms: ActiveAlarm[]): Promise<void> {
    await this.activeAlarmsState.update(() => alarms);
  }

  private setupOnAlarmListener(): void {
    BrowserApi.addListener(chrome.alarms.onAlarm, this.handleOnAlarm);
  }

  private handleOnAlarm = async (alarm: chrome.alarms.Alarm): Promise<void> => {
    await this.triggerAlarm(alarm.name);
  };

  private async triggerAlarm(name: string): Promise<void> {
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
