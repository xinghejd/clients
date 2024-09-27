import { Component, OnInit } from "@angular/core";

import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Component({
  selector: "app-ssh-generator",
  templateUrl: "sshkey-generator.component.html",
})
export class SshKeyGeneratorDialogComponent implements OnInit {
  constructor(
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
  ) {}

  ngOnInit(): void {}
}
