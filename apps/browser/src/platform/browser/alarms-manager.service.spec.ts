import { mock, MockProxy } from "jest-mock-extended";
import { Observable } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { GlobalState, StateProvider } from "@bitwarden/common/platform/state";

import { ActiveAlarm, AlarmNames } from "./abstractions/alarms-manager.service";
import { AlarmsManagerService } from "./alarms-manager.service";
import { BrowserApi } from "./browser-api";

let activeAlarms: ActiveAlarm[] = [];
jest.mock("rxjs", () => ({
  firstValueFrom: jest.fn(() => Promise.resolve(activeAlarms)),
  map: jest.fn(),
  Observable: jest.fn(),
}));

describe("AlarmsManagerService", () => {
  let logService: MockProxy<LogService>;
  let stateProvider: MockProxy<StateProvider>;
  let alarmsManagerService: AlarmsManagerService;

  beforeEach(() => {
    activeAlarms = [];
    logService = mock<LogService>();
    stateProvider = mock<StateProvider>({
      getGlobal: jest.fn(() =>
        mock<GlobalState<any>>({
          state$: mock<Observable<any>>(),
        }),
      ),
    });
    alarmsManagerService = new AlarmsManagerService(logService, stateProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("setTimeoutAlarm", () => {
    it("throws an error if called with a delayInMinutes less than 1", async () => {
      await expect(
        async () =>
          await alarmsManagerService.setTimeoutAlarm(
            AlarmNames.clearClipboardTimeout,
            jest.fn(),
            0.5,
          ),
      ).rejects.toThrow(
        "setTimeoutAlarm delay must be at least 1 minute. Use globalThis.setTimeout for shorter delays.",
      );
    });

    it("triggers the recovered alarm immediately ", async () => {
      activeAlarms = [mock<ActiveAlarm>({ name: AlarmNames.clearClipboardTimeout })];
      jest.spyOn(BrowserApi, "getAlarm").mockResolvedValue(undefined);
      alarmsManagerService["recoveredAlarms"].add(AlarmNames.clearClipboardTimeout);
      const callback = jest.fn();

      await alarmsManagerService.setTimeoutAlarm(AlarmNames.clearClipboardTimeout, callback, 10);

      expect(callback).toHaveBeenCalled();
    });
  });
});
