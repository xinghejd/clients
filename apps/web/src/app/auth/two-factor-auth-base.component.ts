import { Directive, OnDestroy } from "@angular/core";

@Directive()
export class TwoFactorAuthBaseComponent implements OnDestroy {
  tokenValue: string = "";

  constructor() {}

  ngOnDestroy(): void {}
}
