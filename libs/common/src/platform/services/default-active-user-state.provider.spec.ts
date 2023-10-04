import { matches, mock, mockReset } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";
import { Jsonify } from "type-fest";

import { AccountInfo, AccountService } from "../../auth/abstractions/account.service";
import { AuthenticationStatus } from "../../auth/enums/authentication-status";
import { UserId } from "../../types/guid";
import { AbstractMemoryStorageService } from "../abstractions/storage.service";
import { KeyDefinition } from "../types/key-definition";
import { StateDefinition } from "../types/state-definition";

import { DefaultActiveUserStateProvider } from "./default-active-user-state.provider";

class TestState {
  date: Date;
  array: string[];
  // TODO: More complex data types

  static fromJSON(jsonState: Jsonify<TestState>) {
    if (jsonState == null) {
      return null;
    }

    return Object.assign(new TestState(), jsonState, {
      date: new Date(jsonState.date),
    });
  }
}

const testStateDefinition = new StateDefinition("fake", "disk");

const testKeyDefinition = new KeyDefinition<TestState>(
  testStateDefinition,
  "fake",
  TestState.fromJSON
);

describe("DefaultStateProvider", () => {
  const accountService = mock<AccountService>();
  const memoryStorageService = mock<AbstractMemoryStorageService>();
  const diskStorageService = mock<AbstractMemoryStorageService>();

  const activeAccountSubject = new BehaviorSubject<{ id: UserId } & AccountInfo>(undefined);

  let activeUserStateProvider: DefaultActiveUserStateProvider;

  beforeEach(() => {
    mockReset(accountService);
    mockReset(memoryStorageService);
    mockReset(diskStorageService);

    accountService.activeAccount$ = activeAccountSubject;

    activeUserStateProvider = new DefaultActiveUserStateProvider(
      accountService,
      null, // Not testing derived state
      null, // Not testing memory storage
      diskStorageService,
      null // Not testing secure storage
    );
  });

  it("createUserState", async () => {
    diskStorageService.get.mockImplementationOnce(() => {
      return Promise.resolve({
        date: "2023-09-21T13:14:17.648Z",
        array: ["value1", "value2"],
      } as Jsonify<TestState>);
    });

    const fakeDomainState = activeUserStateProvider.create(testKeyDefinition);

    const subscribeCallback = jest.fn<void, [TestState]>();
    const subscription = fakeDomainState.state$.subscribe(subscribeCallback);

    // User signs in
    activeAccountSubject.next({
      id: "1" as UserId,
      email: "useremail",
      name: "username",
      status: AuthenticationStatus.Locked,
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    // Service does an update
    await fakeDomainState.update((state) => {
      state.array.push("value3");
      return state;
    });
    await new Promise<void>((resolve) => setTimeout(resolve, 10));

    subscription.unsubscribe();

    // No user at the start, no data
    expect(subscribeCallback).toHaveBeenNthCalledWith(1, null);

    // Gotten starter user data
    expect(subscribeCallback).toHaveBeenNthCalledWith(
      2,
      matches<TestState>((value) => {
        return true;
      })
    );

    // Gotten update callback data
    expect(subscribeCallback).toHaveBeenNthCalledWith(
      3,
      matches<TestState>((value) => {
        return (
          value != null &&
          typeof value.date == "object" &&
          value.date.getFullYear() == 2023 &&
          value.array.length == 3
        );
      })
    );
  });
});
