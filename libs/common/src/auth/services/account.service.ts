import { BehaviorSubject, Subject } from "rxjs";

import { InternalAccountService } from "../../auth/abstractions/account.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { UserId } from "../../types/guid";
import { AuthenticationStatus } from "../enums/authentication-status";

export class AccountServiceImplementation implements InternalAccountService {
  private accounts = new BehaviorSubject<Record<UserId, AuthenticationStatus>>({});
  private activeAccount = new BehaviorSubject<{
    id: UserId | undefined;
    status: AuthenticationStatus | undefined;
  }>({ id: undefined, status: undefined });
  private lock = new Subject<UserId>();
  private logout = new Subject<UserId>();

  accounts$ = this.accounts.asObservable();
  activeAccount$ = this.activeAccount.asObservable();
  accountLock$ = this.lock.asObservable();
  accountLogout$ = this.logout.asObservable();
  constructor(private messagingService: MessagingService, private logService: LogService) {}

  setAccountStatus(userId: UserId, status: AuthenticationStatus): void {
    this.accounts.value[userId] = status;
    this.accounts.next(this.accounts.value);
    if (status === AuthenticationStatus.LoggedOut) {
      this.logout.next(userId);
    } else if (status === AuthenticationStatus.Locked) {
      this.lock.next(userId);
    }
  }

  switchAccount(userId: UserId) {
    if (this.accounts.value[userId] != null) {
      throw new Error("Account does not exist");
    }
  }

  // TODO: update to use our own account status settings.
  async delete(): Promise<void> {
    try {
      this.messagingService.send("logout");
    } catch (e) {
      this.logService.error(e);
      throw e;
    }
  }
}
