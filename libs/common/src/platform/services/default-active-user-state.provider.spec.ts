import { matches, mock, mockReset } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";
import { Jsonify } from "type-fest";

import { StateService } from "../abstractions/state.service"
import { AbstractMemoryStorageService } from "../abstractions/storage.service";
import { KeyDefinition } from "../types/key-definition";
import { StateDefinition } from "../types/state-definition";

import { DefaultActiveUserStateProvider } from "./default-active-user-state.provider";

class TestState {
  date: Date;
  array: string[]
  // TODO: More complex data types

  static fromJSON(jsonState: Jsonify<TestState>) {
    const state = new TestState();
    state.date = new Date(jsonState.date);
    state.array = jsonState.array;
    return state;
  }
}

const testStateDefinition = new StateDefinition("fake", "disk");

const testKeyDefinition = new KeyDefinition<TestState>(testStateDefinition, "fake", TestState.fromJSON);

describe("DefaultStateProvider", () => {
  const stateService = mock<StateService>();
  const memoryStorageService = mock<AbstractMemoryStorageService>();
  const diskStorageService = mock<AbstractMemoryStorageService>();

  const activeAccountSubject = new BehaviorSubject<string>(undefined);

  let activeUserStateProvider: DefaultActiveUserStateProvider;

  beforeEach(() => {
    mockReset(stateService);
    mockReset(memoryStorageService);
    mockReset(diskStorageService);

    stateService.activeAccount$ = activeAccountSubject;

    activeUserStateProvider = new DefaultActiveUserStateProvider(
      stateService,
      null, // Not testing derived state
      null, // Not testing memory storage
      diskStorageService,
      null // Not testing secure storage
    );
  });

  it("createUserState", async () => {
    diskStorageService.get
      .mockImplementation(async (key, options) => {
        if (key == "fake_1") {
          return {date: "2023-09-21T13:14:17.648Z", array: ["value1", "value2"]}
        }
        return undefined;
      });

    const fakeDomainState = activeUserStateProvider.create(testKeyDefinition);

    const subscribeCallback = jest.fn<void, [TestState]>();
    const subscription = fakeDomainState.state$.subscribe(subscribeCallback);

    // User signs in
    activeAccountSubject.next("1");
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    // Service does an update
    await fakeDomainState.update(state => state.array.push("value3"));
    await new Promise<void>(resolve => setTimeout(resolve, 10));

    subscription.unsubscribe();

    // No user at the start, no data
    expect(subscribeCallback).toHaveBeenNthCalledWith(1, null);

    // Gotten starter user data
    expect(subscribeCallback).toHaveBeenNthCalledWith(2, matches<TestState>(value => {
      return true;
    }));

    // Gotten update callback data
    expect(subscribeCallback).toHaveBeenNthCalledWith(3, matches<TestState>((value) => {
      return value != null &&
        typeof value.date == "object" &&
        value.date.getFullYear() == 2023 &&
        value.array.length == 3
    }));
  });
});
