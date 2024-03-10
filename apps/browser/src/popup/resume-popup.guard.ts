import { inject } from "@angular/core";
import { CanActivateFn, UrlSerializer } from "@angular/router";

import { BrowserRouterService } from "../platform/popup/services/browser-router.service";

/** Redirect to the last visited route. Should be applied to root route. */
export const resumePopupGuard = (): CanActivateFn => {
  return async () => {
    const browserRouterService = inject(BrowserRouterService);
    const urlSerializer = inject(UrlSerializer);

    const url = await browserRouterService.last();

    if (!url) {
      return true;
    }

    return urlSerializer.parse(url);
  };
};
