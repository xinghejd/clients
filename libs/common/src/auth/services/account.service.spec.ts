import { MockProxy, mock } from "jest-mock-extended";
import { BehaviorSubject } from "rxjs";

import { trackEmissions } from "../../../spec/utils";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { UserId } from "../../types/guid";
import { AuthenticationStatus } from "../enums/authentication-status";

import { AccountServiceImplementation } from "./account.service";

describe("accountService", () => {
  let messagingService: MockProxy<MessagingService>;
  let logService: MockProxy<LogService>;
  let sut: AccountServiceImplementation;
  const userId = "userId" as UserId;

  beforeEach(() => {
    messagingService = mock<MessagingService>();
    logService = mock<LogService>();

    sut = new AccountServiceImplementation(messagingService, logService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("setAccountStatus", () => {
    let sutAccounts: BehaviorSubject<Record<UserId, AuthenticationStatus>>;
    let accountsNext: jest.SpyInstance;
    let emissions: Record<UserId, AuthenticationStatus>[];

    beforeEach(() => {
      sutAccounts = sut["accounts"];
      accountsNext = jest.spyOn(sutAccounts, "next");
      emissions = [];
      sutAccounts.subscribe((value) => emissions.push(JSON.parse(JSON.stringify(value))));
    });

    it("should not emit if the status is the same", () => {
      sut.setAccountStatus(userId, AuthenticationStatus.Locked);
      sut.setAccountStatus(userId, AuthenticationStatus.Locked);

      expect(sutAccounts.value).toEqual({ userId: AuthenticationStatus.Locked });
      expect(accountsNext).toHaveBeenCalledTimes(1);
    });

    it("should emit if the status is different", () => {
      const emissions = trackEmissions(sutAccounts);
      sut.setAccountStatus(userId, AuthenticationStatus.Unlocked);
      sut.setAccountStatus(userId, AuthenticationStatus.Locked);

      expect(emissions).toEqual([
        {}, // initial value
        { userId: AuthenticationStatus.Unlocked },
        { userId: AuthenticationStatus.Locked },
      ]);
    });

    it("should emit logout if the status is logged out", () => {
      const emissions = trackEmissions(sut.accountLogout$);
      sut.setAccountStatus(userId, AuthenticationStatus.Unlocked);
      sut.setAccountStatus(userId, AuthenticationStatus.LoggedOut);

      expect(emissions).toEqual([userId]);
    });

    it("should emit lock if the status is locked", () => {
      const emissions = trackEmissions(sut.accountLock$);
      sut.setAccountStatus(userId, AuthenticationStatus.Unlocked);
      sut.setAccountStatus(userId, AuthenticationStatus.Locked);

      expect(emissions).toEqual([userId]);
    });
  });

  describe("switchAccount", () => {
    let emissions: { id: string; status: AuthenticationStatus }[];

    beforeEach(() => {
      emissions = [];
      sut.activeAccount$.subscribe((value) => emissions.push(value));
    });

    it("should emit undefined if no account is provided", () => {
      sut.switchAccount(undefined);

      expect(emissions).toEqual([undefined]);
    });

    it("should emit the active account and status", () => {
      sut.setAccountStatus(userId, AuthenticationStatus.Unlocked);
      sut.switchAccount(userId);
      sut.setAccountStatus(userId, AuthenticationStatus.Locked);
      sut.switchAccount(undefined);
      sut.switchAccount(undefined);
      expect(emissions).toEqual([
        undefined, // initial value
        { id: userId, status: AuthenticationStatus.Unlocked },
        { id: userId, status: AuthenticationStatus.Locked },
      ]);
    });

    it("should throw if switched to an unknown account", () => {
      expect(() => sut.switchAccount(userId)).toThrowError("Account does not exist");
    });
  });
});
