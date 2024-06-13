import { Input, OnDestroy } from "@angular/core";

export class TwoFactorAuthenticatorLoginComponent implements OnDestroy {
  @Input() onSubmit: () => void;

  constructor() {}

  ngOnDestroy(): void {}
}
