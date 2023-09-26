import { Observable } from "rxjs";

import { UserId } from "../../types/guid";
import { AuthenticationStatus } from "../enums/authentication-status";

export abstract class AccountService {
  accounts$: Observable<Record<UserId, AuthenticationStatus>>;
  activeAccount$: Observable<{ id: UserId | undefined; status: AuthenticationStatus | undefined }>;
  accountLock$: Observable<UserId>;
  accountLogout$: Observable<UserId>;
  abstract setAccountStatus(userId: UserId, status: AuthenticationStatus): void;
  abstract switchAccount(userId: UserId): void;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
}
