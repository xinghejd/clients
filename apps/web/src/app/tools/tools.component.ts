import { Component, OnInit } from "@angular/core";

import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigServiceAbstraction } from "@bitwarden/common/platform/abstractions/config/config.service.abstraction";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";

@Component({
  selector: "app-tools",
  templateUrl: "tools.component.html",
})
export class ToolsComponent implements OnInit {
  canAccessPremium = false;
  generatorV2Active = false;

  constructor(
    private stateService: StateService,
    private messagingService: MessagingService,
    private configService: ConfigServiceAbstraction,
  ) {}

  async ngOnInit() {
    this.canAccessPremium = await this.stateService.getCanAccessPremium();
    this.generatorV2Active = await this.configService.getFeatureFlag(
      FeatureFlag.GeneratorToolsModernization,
    );
  }

  premiumRequired() {
    if (!this.canAccessPremium) {
      this.messagingService.send("premiumRequired");
      return;
    }
  }
}
