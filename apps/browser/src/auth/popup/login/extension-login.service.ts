import { DefaultLoginService, LoginService } from "@bitwarden/auth/angular";

export class ExtensionLoginService extends DefaultLoginService implements LoginService {}
