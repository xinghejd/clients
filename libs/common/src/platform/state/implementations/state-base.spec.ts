import { mock } from "jest-mock-extended";

import { FakeStorageService, ObservableTracker } from "../../../../spec";
import { StorageKey } from "../../../types/state";
import { LogService } from "../../abstractions/log.service";
import { KeyDefinition } from "../key-definition";
import { StateDefinition } from "../state-definition";

import { StateBase } from "./state-base";

class TestStateBase extends StateBase<string, KeyDefinition<string>> {}

describe("StateBase", () => {
  const storageKey = "key" as StorageKey;
  const stateDefinition = new StateDefinition("fake", "disk");
  const keyDefinition = new KeyDefinition<string>(stateDefinition, "fake", {
    deserializer: (value) => value,
  });
  const logService = mock<LogService>();

  let storageService: FakeStorageService;
  let sut: TestStateBase;

  beforeEach(() => {
    storageService = new FakeStorageService();
    sut = new TestStateBase(storageKey, storageService, keyDefinition, logService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("awaits update until `state$` matches", async () => {
    storageService.save = jest.fn().mockImplementation(
      (key: string, obj: any) =>
        new Promise<void>((resolve) => {
          storageService.internalStore[key] = obj;
          resolve();
        }),
    );

    const updatePromise = sut.update(() => "new value");

    await expect(promiseState(updatePromise)).resolves.toBe("pending");

    const tracker = new ObservableTracker(sut.state$);
    storageService.updatesSubject.next({ key: storageKey, updateType: "save" });
    await tracker.expectEmission();

    await expect(promiseState(updatePromise)).resolves.toBe("fulfilled");
  });
});

function promiseState(p: Promise<any>) {
  const t = {};
  return Promise.race([p, t]).then(
    (v) => (v === t ? "pending" : "fulfilled"),
    () => "rejected",
  );
}
