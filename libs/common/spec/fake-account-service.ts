import { mock } from "jest-mock-extended";
import { Observable, ReplaySubject } from "rxjs";

import { AccountInfo, AccountService } from "../src/auth/abstractions/account.service";
import { AuthenticationStatus } from "../src/auth/enums/authentication-status";
import { UserId } from "../src/types/guid";

export function mockAccountServiceWith(
  userId: UserId,
  info: Partial<AccountInfo> = {},
  activity: Record<UserId, Date> = {},
): FakeAccountService {
  const fullInfo: AccountInfo = {
    ...info,
    ...{
      name: "name",
      email: "email",
      emailVerified: true,
      status: AuthenticationStatus.Locked,
    },
  };

  const fullActivity = { [userId]: new Date(), ...activity };

  const service = new FakeAccountService({ [userId]: fullInfo }, fullActivity);
  service.activeAccountSubject.next({ id: userId, ...fullInfo });
  return service;
}

export class FakeAccountService implements AccountService {
  mock = mock<AccountService>();
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  accountsSubject = new ReplaySubject<Record<UserId, AccountInfo>>(1);
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  activeAccountSubject = new ReplaySubject<{ id: UserId } & AccountInfo>(1);
  // eslint-disable-next-line rxjs/no-exposed-subjects -- test class
  accountActivitySubject = new ReplaySubject<Record<UserId, Date>>(1);
  private _activeUserId: UserId;
  get activeUserId() {
    return this._activeUserId;
  }
  get accounts$() {
    return this.accountsSubject.asObservable();
  }
  get activeAccount$() {
    return this.activeAccountSubject.asObservable();
  }
  accountLock$: Observable<UserId>;
  accountLogout$: Observable<UserId>;
  accountActivity$: Observable<Record<UserId, Date>>;

  constructor(initialData: Record<UserId, AccountInfo>, accountActivity?: Record<UserId, Date>) {
    this.accountsSubject.next(initialData);
    this.activeAccountSubject.subscribe((data) => (this._activeUserId = data?.id));
    this.activeAccountSubject.next(null);
    this.accountActivitySubject.next(accountActivity);
  }
  async setAccountEmailVerified(userId: UserId, emailVerified: boolean): Promise<void> {
    await this.mock.setAccountEmailVerified(userId, emailVerified);
  }
  async setAccountActivity(userId: UserId, lastActivity: Date): Promise<void> {
    await this.mock.setAccountActivity(userId, lastActivity);
  }

  async addAccount(userId: UserId, accountData: AccountInfo): Promise<void> {
    const current = this.accountsSubject["_buffer"][0] ?? {};
    this.accountsSubject.next({ ...current, [userId]: accountData });
    await this.mock.addAccount(userId, accountData);
  }

  async setAccountName(userId: UserId, name: string): Promise<void> {
    await this.mock.setAccountName(userId, name);
  }

  async setAccountEmail(userId: UserId, email: string): Promise<void> {
    await this.mock.setAccountEmail(userId, email);
  }

  async setAccountStatus(userId: UserId, status: AuthenticationStatus): Promise<void> {
    await this.mock.setAccountStatus(userId, status);
  }

  async setMaxAccountStatus(userId: UserId, maxStatus: AuthenticationStatus): Promise<void> {
    await this.mock.setMaxAccountStatus(userId, maxStatus);
  }

  async switchAccount(userId: UserId): Promise<void> {
    const next =
      userId == null ? null : { id: userId, ...this.accountsSubject["_buffer"]?.[0]?.[userId] };
    this.activeAccountSubject.next(next);
    await this.mock.switchAccount(userId);
  }
}
