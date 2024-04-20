import { matches, mock } from "jest-mock-extended";
import { BehaviorSubject, ReplaySubject, Subject, filter, firstValueFrom, of, timeout } from "rxjs";

import { AccountInfo, AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AvatarService } from "@bitwarden/common/auth/abstractions/avatar.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import {
  CommandDefinition,
  Message,
  MessageListener,
  MessageSender,
} from "@bitwarden/common/platform/messaging";
// eslint-disable-next-line no-restricted-imports -- used to create test environment
import { SubjectMessageSender } from "@bitwarden/common/platform/messaging/subject-message.sender";
import { UserId } from "@bitwarden/common/types/guid";

import { AccountSwitcherService } from "./account-switcher.service";

describe("AccountSwitcherService", () => {
  let accountsSubject: BehaviorSubject<Record<UserId, AccountInfo>>;
  let activeAccountSubject: BehaviorSubject<{ id: UserId } & AccountInfo>;
  let authStatusSubject: ReplaySubject<Record<UserId, AuthenticationStatus>>;

  const accountService = mock<AccountService>();
  const avatarService = mock<AvatarService>();
  const messageListener = mock<MessageListener>();
  const messageSender = mock<MessageSender>();
  const environmentService = mock<EnvironmentService>();
  const logService = mock<LogService>();
  const authService = mock<AuthService>();

  let accountSwitcherService: AccountSwitcherService;

  beforeEach(() => {
    jest.resetAllMocks();
    accountsSubject = new BehaviorSubject<Record<UserId, AccountInfo>>(null);
    activeAccountSubject = new BehaviorSubject<{ id: UserId } & AccountInfo>(null);
    authStatusSubject = new ReplaySubject<Record<UserId, AuthenticationStatus>>(1);

    const messageSubject = new Subject<Message<object>>();
    messageListener.allMessages$ = messageSubject.asObservable();
    messageListener.messages$.mockImplementation((command) =>
      messageSubject.pipe(filter((m) => (m as Message<object>).command === command.command)),
    );
    const realMessageSender = new SubjectMessageSender(messageSubject);
    messageSender.send.mockImplementation((...args) => realMessageSender.send(...args));

    // Use subject to allow for easy updates
    accountService.accounts$ = accountsSubject;
    accountService.activeAccount$ = activeAccountSubject;
    authService.authStatuses$ = authStatusSubject;

    accountSwitcherService = new AccountSwitcherService(
      accountService,
      avatarService,
      messageSender,
      messageListener,
      environmentService,
      logService,
      authService,
    );
  });

  afterEach(() => {
    accountsSubject.complete();
    activeAccountSubject.complete();
    authStatusSubject.complete();
  });

  describe("availableAccounts$", () => {
    it("should return all logged in accounts and an add account option when accounts are less than 5", async () => {
      const accountInfo: AccountInfo = {
        name: "Test User 1",
        email: "test1@email.com",
      };

      avatarService.getUserAvatarColor$.mockReturnValue(of("#cccccc"));
      accountsSubject.next({ ["1" as UserId]: accountInfo, ["2" as UserId]: accountInfo });
      authStatusSubject.next({
        ["1" as UserId]: AuthenticationStatus.Unlocked,
        ["2" as UserId]: AuthenticationStatus.Locked,
      });
      activeAccountSubject.next(Object.assign(accountInfo, { id: "1" as UserId }));

      const accounts = await firstValueFrom(
        accountSwitcherService.availableAccounts$.pipe(timeout(20)),
      );
      expect(accounts).toHaveLength(3);
      expect(accounts[0].id).toBe("1");
      expect(accounts[0].isActive).toBeTruthy();
      expect(accounts[1].id).toBe("2");
      expect(accounts[1].isActive).toBeFalsy();

      expect(accounts[2].id).toBe("addAccount");
      expect(accounts[2].isActive).toBeFalsy();
    });

    it.each([5, 6])(
      "should return only accounts if there are %i accounts",
      async (numberOfAccounts) => {
        const seedAccounts: Record<UserId, AccountInfo> = {};
        const seedStatuses: Record<UserId, AuthenticationStatus> = {};
        for (let i = 0; i < numberOfAccounts; i++) {
          seedAccounts[`${i}` as UserId] = {
            email: `test${i}@email.com`,
            name: "Test User ${i}",
          };
          seedStatuses[`${i}` as UserId] = AuthenticationStatus.Unlocked;
        }
        avatarService.getUserAvatarColor$.mockReturnValue(of("#cccccc"));
        accountsSubject.next(seedAccounts);
        authStatusSubject.next(seedStatuses);
        activeAccountSubject.next(
          Object.assign(seedAccounts["1" as UserId], { id: "1" as UserId }),
        );

        const accounts = await firstValueFrom(accountSwitcherService.availableAccounts$);

        expect(accounts).toHaveLength(numberOfAccounts);
        accounts.forEach((account) => {
          expect(account.id).not.toBe("addAccount");
        });
      },
    );

    it("excludes logged out accounts", async () => {
      const user1AccountInfo: AccountInfo = {
        name: "Test User 1",
        email: "",
      };
      accountsSubject.next({ ["1" as UserId]: user1AccountInfo });
      authStatusSubject.next({ ["1" as UserId]: AuthenticationStatus.LoggedOut });
      accountsSubject.next({
        "1": user1AccountInfo,
      } as Record<UserId, AccountInfo>);

      const accounts = await firstValueFrom(
        accountSwitcherService.availableAccounts$.pipe(timeout(20)),
      );

      // Add account only
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe("addAccount");
    });
  });

  describe("selectAccount", () => {
    const switchAccountFinish = new CommandDefinition("switchAccountFinish");
    it("initiates an add account logic when add account is selected", async () => {
      const selectAccountPromise = accountSwitcherService.selectAccount("addAccount");

      expect(messageListener.messages$).toHaveBeenCalledWith(switchAccountFinish);

      messageSender.send(switchAccountFinish, { userId: null });

      await selectAccountPromise;

      expect(accountService.switchAccount).toBeCalledWith(null);
    });

    it("initiates an account switch with an account id", async () => {
      const selectAccountPromise = accountSwitcherService.selectAccount("1");

      messageSender.send(switchAccountFinish, { userId: "1" });

      await selectAccountPromise;

      expect(accountService.switchAccount).toBeCalledWith("1");
      expect(messageSender.send).toBeCalledWith(
        "switchAccount",
        matches((payload) => {
          return payload.userId === "1";
        }),
      );
    });
  });
});
