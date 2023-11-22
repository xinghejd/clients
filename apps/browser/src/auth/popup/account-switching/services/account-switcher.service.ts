import { Injectable } from "@angular/core";
import { Observable, combineLatest, switchMap } from "rxjs";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";
import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { UserId } from "@bitwarden/common/types/guid";

export type AvailableAccount = {
  name: string;
  email?: string;
  id: string;
  isActive: boolean;
  server?: string;
  status?: AuthenticationStatus;
  avatarColor?: string;
};

@Injectable({
  providedIn: "root",
})
export class AccountSwitcherService {
  ACCOUNT_LIMIT = 5;
  SPECIAL_ADD_ACCOUNT_ID = "addAccount";
  availableAccounts$: Observable<AvailableAccount[]>;

  constructor(
    private accountService: AccountService,
    private stateService: StateService,
    private messagingService: MessagingService,
    private environmentService: EnvironmentService
  ) {
    this.availableAccounts$ = combineLatest([
      this.accountService.accounts$,
      this.accountService.activeAccount$,
    ]).pipe(
      switchMap(async ([accounts, activeAccount]) => {
        const accountEntries = Object.entries(accounts).filter(
          ([_, account]) => account.status !== AuthenticationStatus.LoggedOut
        );
        // Accounts shouldn't ever be more than ACCOUNT_LIMIT but just in case do a greater than
        const hasMaxAccounts = accountEntries.length >= this.ACCOUNT_LIMIT;
        const options: AvailableAccount[] = await Promise.all(
          accountEntries.map(async ([id, account]) => {
            return {
              name: account.name ?? account.email,
              email: account.email,
              id: id,
              server: await this.environmentService.getHost(id),
              status: account.status,
              isActive: id === activeAccount?.id,
              avatarColor: await this.stateService.getAvatarColor({ userId: id }),
            };
          })
        );

        if (!hasMaxAccounts) {
          options.push({
            name: "Add account",
            id: this.SPECIAL_ADD_ACCOUNT_ID,
            isActive: activeAccount?.id == null,
          });
        }

        return options;
      })
    );
  }

  async selectAccount(id: string) {
    if (id === this.SPECIAL_ADD_ACCOUNT_ID) {
      id = null;
    }

    await this.accountService.switchAccount(id as UserId);
    this.messagingService.send("switchAccount", { userId: id });
  }
}
