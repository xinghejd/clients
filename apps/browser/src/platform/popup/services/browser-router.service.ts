import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { filter } from "rxjs";

import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

@Injectable({
  providedIn: "root",
})
export class BrowserRouterService {
  private previousUrl?: string = undefined;

  constructor(router: Router, private stateService: StateService) {
    router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const state: ActivatedRouteSnapshot = router.routerState.snapshot.root;

        let child = state.firstChild;
        while (child.firstChild) {
          child = child.firstChild;
        }

        const updateUrl = !child?.data?.doNotSaveUrl ?? true;

        if (updateUrl) {
          this.setPreviousUrl(event.url);
        }
      });
  }

  getPreviousUrl(): string | undefined {
    return this.previousUrl;
  }

  setPreviousUrl(url: string): void {
    this.previousUrl = url;
  }

  /**
   * Persists the given URL using the state service.
   * @param {string} url - The URL to be persisted
   */
  async persistPreviousUrl(url: string): Promise<void> {
    await this.stateService.setPreviousUrl(url);
  }

  /**
   * Retrives the previously persisted URL from the state service and clears it.
   */
  async getAndClearPreviousUrl(): Promise<string | undefined> {
    const persistedPreviousUrl = await this.stateService.getPreviousUrl();

    if (!Utils.isNullOrEmpty(persistedPreviousUrl)) {
      await this.stateService.setPreviousUrl(null);
      return persistedPreviousUrl;
    }

    return;
  }
}
