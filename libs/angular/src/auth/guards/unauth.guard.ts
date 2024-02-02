import { Injectable, inject } from "@angular/core";
import { CanActivate, CanActivateFn, Router, UrlTree } from "@angular/router";
import { Observable, map } from "rxjs";
import { tap } from "rxjs/operators";

import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { AuthService } from "@bitwarden/common/auth/abstractions/auth.service";
import { AuthenticationStatus } from "@bitwarden/common/auth/enums/authentication-status";

/**
 * @deprecated use unauthGuardFn function instead
 */
@Injectable()
export class UnauthGuard implements CanActivate {
  protected homepage = "vault";
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  async canActivate() {
    const authStatus = await this.authService.getAuthStatus();

    if (authStatus === AuthenticationStatus.LoggedOut) {
      return true;
    }

    if (authStatus === AuthenticationStatus.Locked) {
      return this.router.createUrlTree(["lock"]);
    }

    return this.router.createUrlTree([this.homepage]);
  }
}

type UnauthRoutes = {
  homepage: () => string;
  locked: string;
};

const defaultRoutes: UnauthRoutes = {
  homepage: () => "/vault",
  locked: "/lock",
};

function unauthGuard(routes: UnauthRoutes): Observable<boolean | UrlTree> {
  const accountService = inject(AccountService);
  const router = inject(Router);

  console.log("unauthGuard -> accountService", accountService);
  return accountService.activeAccount$.pipe(
    tap({
      subscribe: () => console.log("before map unauthGuard sub"),
      unsubscribe: () => console.log("before map unauthGuard unsub"),
      next: (v) => console.log("before map unauthGuard next", v),
    }),
    map((accountData) => {
      console.log("unauthGuard -> accountData", accountData);

      if (accountData == null || accountData.status === AuthenticationStatus.LoggedOut) {
        return true;
      } else if (accountData.status === AuthenticationStatus.Locked) {
        return router.createUrlTree([routes.locked]);
      } else {
        return router.createUrlTree([routes.homepage()]);
      }
    }),
    tap({
      subscribe: () => console.log("unauthGuard sub"),
      unsubscribe: () => console.log("unauthGuard unsub"),
      next: (v) => console.log("unauthGuard next", v),
    }),
  );
}

export function unauthGuardFn(overrides: Partial<UnauthRoutes> = {}): CanActivateFn {
  return () => unauthGuard({ ...defaultRoutes, ...overrides });
}
