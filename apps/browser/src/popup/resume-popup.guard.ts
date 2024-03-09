import { Injectable, inject } from "@angular/core";
import { CanActivateFn, NavigationEnd, Router, UrlSerializer } from "@angular/router";
import { filter, firstValueFrom } from "rxjs";

import {
  GlobalStateProvider,
  KeyDefinition,
  LAST_VISITED_ROUTE_MEMORY,
} from "@bitwarden/common/platform/state";

/** The last route accessed in the popup */
const LAST_VISITED_ROUTE_KEY = new KeyDefinition<string>(
  LAST_VISITED_ROUTE_MEMORY,
  "lastVisitedRoute",
  {
    deserializer: (obj) => obj,
  },
);

@Injectable({ providedIn: "root" })
export class ResumePopupService {
  private popupResumeRouteState = inject(GlobalStateProvider).get(LAST_VISITED_ROUTE_KEY);
  private router = inject(Router);

  constructor() {
    /** Update the stored route on every successful navigation */
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      void this.popupResumeRouteState.update(() => (e as NavigationEnd).url);
    });
  }

  async getStoredUrl() {
    return firstValueFrom(this.popupResumeRouteState.state$);
  }

  async clearStoredUrl() {
    await this.popupResumeRouteState.update(() => null);
  }
}

/** Redirect to the last visited route. Should be applied to root route. */
export const resumePopupGuard = (): CanActivateFn => {
  return async () => {
    const resumePopupService = inject(ResumePopupService);
    const urlSerializer = inject(UrlSerializer);

    const url = await resumePopupService.getStoredUrl();

    if (!url) {
      return true;
    }

    return urlSerializer.parse(url);
  };
};
