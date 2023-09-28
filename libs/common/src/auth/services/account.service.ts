import {
  BehaviorSubject,
  Subject,
  combineLatestWith,
  map,
  distinctUntilChanged,
  share,
} from "rxjs";

import { InternalAccountService } from "../../auth/abstractions/account.service";
import { LogService } from "../../platform/abstractions/log.service";
import { MessagingService } from "../../platform/abstractions/messaging.service";
import { UserId } from "../../types/guid";
import { AuthenticationStatus } from "../enums/authentication-status";

export class AccountServiceImplementation implements InternalAccountService {
  private accounts = new BehaviorSubject<Record<UserId, AuthenticationStatus>>({});
  private activeAccountId = new BehaviorSubject<UserId | undefined>(undefined);
  private lock = new Subject<UserId>();
  private logout = new Subject<UserId>();

  accounts$ = this.accounts.asObservable();
  activeAccount$ = this.activeAccountId.pipe(
    combineLatestWith(this.accounts$),
    map(([id, accounts]) => (id ? { id, status: accounts[id] } : undefined)),
    distinctUntilChanged((a, b) => a.id === b.id && a.status === b.status),
    share()
  );
  accountLock$ = this.lock.asObservable();
  accountLogout$ = this.logout.asObservable();
  constructor(private messagingService: MessagingService, private logService: LogService) {}

  setAccountStatus(userId: UserId, status: AuthenticationStatus): void {
    if (this.accounts.value[userId] === status) {
      // Do not emit on no change
      return;
    }

    this.accounts.value[userId] = status;
    this.accounts.next(this.accounts.value);
    if (status === AuthenticationStatus.LoggedOut) {
      this.logout.next(userId);
    } else if (status === AuthenticationStatus.Locked) {
      this.lock.next(userId);
    }
  }

  switchAccount(userId: UserId) {
    if (userId == null) {
      // indicates no account is active
      this.activeAccountId.next(undefined);
      return;
    }

    if (this.accounts.value[userId] == null) {
      throw new Error("Account does not exist");
    }
    this.activeAccountId.next(userId);
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
