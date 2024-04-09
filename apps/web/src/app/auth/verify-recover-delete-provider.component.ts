import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { first } from "rxjs/operators";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { ProviderVerifyDeleteRecoverRequest } from "@bitwarden/common/admin-console/models/request//provider/provider-verify-delete-recover.request";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";

@Component({
  selector: "app-verify-recover-delete-provider",
  templateUrl: "verify-recover-delete-provider.component.html",
})
// eslint-disable-next-line rxjs-angular/prefer-takeuntil
export class VerifyRecoverDeleteProviderComponent implements OnInit {
  name: string;
  formPromise: Promise<any>;

  private providerId: string;
  private token: string;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private platformUtilsService: PlatformUtilsService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private logService: LogService,
  ) {}

  ngOnInit() {
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil, rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (qParams) => {
      if (qParams.orgId != null && qParams.token != null && qParams.name != null) {
        this.providerId = qParams.providerId;
        this.token = qParams.token;
        this.name = qParams.name;
      } else {
        // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this.router.navigate(["/"]);
      }
    });
  }

  async submit() {
    try {
      const request = new ProviderVerifyDeleteRecoverRequest(this.token);
      this.formPromise = this.apiService.providerRecoverDeleteToken(this.providerId, request);
      await this.formPromise;
      this.platformUtilsService.showToast(
        "success",
        this.i18nService.t("accountDeleted"),
        this.i18nService.t("accountDeletedDesc"),
      );
      // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.router.navigate(["/"]);
    } catch (e) {
      this.logService.error(e);
    }
  }
}
