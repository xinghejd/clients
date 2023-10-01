import { Observable } from "rxjs";

export abstract class Fido2StateServiceAbstraction {
  sessionId: string;
  isPasskeys$: Observable<boolean>;
}
