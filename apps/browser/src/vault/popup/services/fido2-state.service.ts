import { Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject } from "rxjs";

import { Fido2StateServiceAbstraction } from "./abstractions/fido2-state.service";

@Injectable()
export class Fido2StateService implements Fido2StateServiceAbstraction {
  private isPasskeysSubject = new BehaviorSubject<boolean>(false);
  isPasskeys$ = this.isPasskeysSubject.asObservable();
  sessionId: string;

  constructor(private route: ActivatedRoute) {
    this.sessionId = this.route.snapshot.queryParams.sessionId;
    const fallbackSupported = this.route.snapshot.queryParams.fallbackSupported;
    this.setIsPasskeys(this.sessionId, fallbackSupported);
  }

  private setIsPasskeys(sessionId: string, fallbackSupported: boolean) {
    this.isPasskeysSubject.next(sessionId != null && fallbackSupported);
  }
}
