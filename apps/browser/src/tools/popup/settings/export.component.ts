import { Component } from "@angular/core";
import { UntypedFormBuilder } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";

import { first } from "rxjs/operators";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/tools/export/components/export.component";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";
import { VaultExportServiceAbstraction } from "@bitwarden/exporter/vault-export";

import { OidcClient, Log as OidcLog } from "oidc-client-ts";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent {
  private client: OidcClient;
  private code: string;
  private state: string;

  constructor(
    cryptoService: CryptoService,
    i18nService: I18nService,
    platformUtilsService: PlatformUtilsService,
    exportService: VaultExportServiceAbstraction,
    eventCollectionService: EventCollectionService,
    policyService: PolicyService,
    private router: Router,
    logService: LogService,
    userVerificationService: UserVerificationService,
    formBuilder: UntypedFormBuilder,
    fileDownloadService: FileDownloadService,
    dialogService: DialogService,
    protected route: ActivatedRoute
  ) {
    super(
      cryptoService,
      i18nService,
      platformUtilsService,
      exportService,
      eventCollectionService,
      policyService,
      window,
      logService,
      userVerificationService,
      formBuilder,
      fileDownloadService,
      dialogService
    );

    OidcLog.setLogger(console);
    OidcLog.setLevel(OidcLog.DEBUG);
    this.route = route;
    this.client = new OidcClient({
      authority: "https://dev-xxxxxx-admin.oktapreview.com",
      client_id: "xxxxxxx",
      redirect_uri: window.location.origin + "/sso-connector.html?lp=1",
      response_type: "code",
      scope: "openid profile email",
      response_mode: "query",
      loadUserInfo: true,
    });
  }

  async ngOnInit() {
    // eslint-disable-next-line rxjs/no-async-subscribe
    this.route.queryParams.pipe(first()).subscribe(async (qParams) => {
      if (qParams.code != null && qParams.state != null) {
        // await this.processSso(qParams.code, qParams.state);
        this.code = qParams.code;
        this.state = qParams.state;
      }
    });
  }

  protected saved() {
    super.saved();
    this.router.navigate(["/tabs/settings"]);
  }

  async sso() {
    const request = await this.client.createSigninRequest({
      state: { test: 123 },
      nonce: "randomstring123",
    });
    this.platformUtilsService.launchUri(request.url);
  }

  async processSso() {
    const query = "&code=" + this.code + "&state=" + this.state;
    const response = await this.client.processSigninResponse(
      this.client.settings.redirect_uri + query
    );
    console.log("response");
    console.log(response);

    let k1 = response.profile["LastPassK1"] as string;
    // K1 is byte string character encoded
    console.log("K1: " + k1);
    console.log("id_token: " + response.id_token);

    let k2Request = {
      company_id: 123,
      id_token: response.id_token,
    };
    /*
    TODO: fetch K2 with k2Request from POST https://accounts.lastpass.com/federatedlogin/api/v1/getkey
    
    response:
    {
    "k2": "base64 k2",
    "fragment_id": "base64 fragment id"
    }
    */
  }
}
