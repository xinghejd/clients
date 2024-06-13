import { Component, EventEmitter, OnDestroy, Output } from "@angular/core";

import { TwoFactorService } from "@bitwarden/common/auth/abstractions/two-factor.service";
import { TwoFactorProviderType } from "@bitwarden/common/auth/enums/two-factor-provider-type";

@Component({
  selector: "app-two-factor-auth-email",
  templateUrl: "two-factor-auth-email.component.html",
})
export class TwoFactorAuthEmailComponent implements OnDestroy {
  twoFactorEmail: string = "uninitialized";

  @Output() token = new EventEmitter<string>();
  tokenValue: string = "";

  constructor(private twoFactorService: TwoFactorService) {}

  async ngOnInit(): Promise<void> {
    const providerData = await this.twoFactorService.getProviders().then((providers) => {
      return providers.get(TwoFactorProviderType.Email);
    });
    this.twoFactorEmail = providerData.email;
  }

  ngOnDestroy(): void {}
}
