import { Directive, EventEmitter, OnDestroy, Output } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";

@Directive({
  standalone: true,
})
export class TwoFactorAuthBaseComponent implements OnDestroy {
  tokenValue: string = "";

  @Output() activeButtonTextChange = new EventEmitter<string>();

  constructor(protected i18nService: I18nService) {}

  ngOnDestroy(): void {}

  async getActionButtonText() {
    return this.i18nService.t("continue");
  }
}
