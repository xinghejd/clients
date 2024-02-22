import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { AVAILABLE_REGIONS } from "@bitwarden/common/platform/abstractions/environment.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";

const REGIONS = [...AVAILABLE_REGIONS];

if (process.env.NODE_ENV === "development") {
  REGIONS.push({
    key: "LOCALHOST",
    domain: "localhost",
    urls: {
      vault: "https://localhost:8080",
    },
  });
}

@Component({
  selector: "environment-selector",
  templateUrl: "environment-selector.component.html",
})
export class EnvironmentSelectorComponent implements OnInit {
  constructor(
    private platformUtilsService: PlatformUtilsService,
    private router: Router,
  ) {}

  protected AvailableRegions = REGIONS;
  protected currentRegion = REGIONS[0];

  protected showRegionSelector = false;
  protected routeAndParams: string;

  async ngOnInit() {
    this.showRegionSelector = !this.platformUtilsService.isSelfHost();
    this.routeAndParams = `/#${this.router.url}`;

    const domain = Utils.getDomain(window.location.href);
    this.currentRegion =
      this.AvailableRegions.find((r) => r.domain === domain) ?? this.AvailableRegions[0];
  }
}
