import { Injectable, inject } from "@angular/core";
import { ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { filter, firstValueFrom } from "rxjs";

import {
  GlobalStateProvider,
  KeyDefinition,
  POPUP_HISTORY_MEMORY,
} from "@bitwarden/common/platform/state";

const POPUP_HISTORY_KEY = new KeyDefinition<string[]>(POPUP_HISTORY_MEMORY, "history", {
  deserializer: (obj) => obj,
});

@Injectable({
  providedIn: "root",
})
export class BrowserRouterService {
  private router = inject(Router);
  private history = inject(GlobalStateProvider).get(POPUP_HISTORY_KEY);

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const state: ActivatedRouteSnapshot = this.router.routerState.snapshot.root;

        let child = state.firstChild;
        while (child.firstChild) {
          child = child.firstChild;
        }

        const updateUrl = !child?.data?.doNotSaveUrl ?? true;

        if (updateUrl) {
          void this.push(event.url);
        }
      });
  }

  async getHistory(): Promise<string[]> {
    return firstValueFrom(this.history.state$);
  }

  /** Get the last item in the history stack */
  async last(): Promise<string> {
    const history = await this.getHistory();
    if (!history || history.length === 0) {
      return null;
    }
    return history[history.length - 1];
  }

  /**
   * Push new URL onto history stack
   */
  async push(url: string): Promise<boolean> {
    if (url === (await this.last())) {
      return false;
    }
    await this.history.update((prevState) => (prevState === null ? [url] : prevState.concat(url)));
    return true;
  }

  /**
   * Navigate back to the prior URL in the history stack
   */
  async back(): Promise<boolean> {
    const length = (await this.getHistory())?.length;
    if (!length) {
      return false;
    }

    await this.history.update((prevState) => {
      return prevState.slice(0, -1);
    });

    const url = await this.last();
    return this.router.navigateByUrl(url);
  }
}
