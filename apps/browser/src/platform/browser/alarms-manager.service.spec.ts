import { mock, MockProxy } from "jest-mock-extended";
import { Observable } from "rxjs";

import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { GlobalState, StateProvider } from "@bitwarden/common/platform/state";

import { AlarmNames } from "./abstractions/alarms-manager.service";
import { AlarmsManagerService } from "./alarms-manager.service";

describe("AlarmsManagerService", () => {
  let logService: MockProxy<LogService>;
  let stateProvider: MockProxy<StateProvider>;
  let alarmsManagerService: AlarmsManagerService;

  beforeEach(() => {
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

    it("triggers the recovered alarm immediately ", () => {});
  });
});
