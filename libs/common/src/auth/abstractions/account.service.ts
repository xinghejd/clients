import { Observable } from "rxjs";

import { UserId } from "../../types/guid";
import { AuthenticationStatus } from "../enums/authentication-status";

export type AccountInfo = {
  status: AuthenticationStatus;
  email: string;
  name: string | undefined;
};

export abstract class AccountService {
  accounts$: Observable<Record<UserId, AccountInfo>>;
  activeAccount$: Observable<{ id: UserId | undefined } & AccountInfo>;
  accountLock$: Observable<UserId>;
  accountLogout$: Observable<UserId>;
  abstract addAccount(userId: UserId, accountData: AccountInfo): void;
  abstract setAccountStatus(userId: UserId, status: AuthenticationStatus): void;
  abstract switchAccount(userId: UserId): void;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
}
