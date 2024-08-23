import { UrlTree } from "@angular/router";

export abstract class LoginService {
  // Web specific
  setPreviousUrl: (route: UrlTree) => void | null;
  handleExistingOrgInvite: () => Promise<void | null>;
}
