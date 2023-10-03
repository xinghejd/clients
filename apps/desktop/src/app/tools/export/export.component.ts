import { Component, OnInit, NgZone } from "@angular/core";
import { UntypedFormBuilder } from "@angular/forms";

import { ExportComponent as BaseExportComponent } from "@bitwarden/angular/tools/export/components/export.component";
import { EventCollectionService } from "@bitwarden/common/abstractions/event/event-collection.service";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { UserVerificationService } from "@bitwarden/common/auth/abstractions/user-verification/user-verification.service.abstraction";
import { BroadcasterService } from "@bitwarden/common/platform/abstractions/broadcaster.service";
import { CryptoService } from "@bitwarden/common/platform/abstractions/crypto.service";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";
import { VaultExportServiceAbstraction } from "@bitwarden/exporter/vault-export";

import { OidcClient, Log as OidcLog } from "oidc-client-ts";

const BroadcasterSubscriptionId = "ExportComponent";

@Component({
  selector: "app-export",
  templateUrl: "export.component.html",
})
export class ExportComponent extends BaseExportComponent implements OnInit {
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
    userVerificationService: UserVerificationService,
    formBuilder: UntypedFormBuilder,
    private broadcasterService: BroadcasterService,
    logService: LogService,
    fileDownloadService: FileDownloadService,
    dialogService: DialogService,
    private ngZone: NgZone
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

    this.client = new OidcClient({
      authority: "https://dev-xxxxxx-admin.oktapreview.com",
      client_id: "xxxxxxxx",
      redirect_uri: "bitwarden://sso-callback-lp",
      response_type: "code",
      scope: "openid profile email",
      response_mode: "query",
      loadUserInfo: true,
    });
  }

  async ngOnInit() {
    await super.ngOnInit();
    this.broadcasterService.subscribe(BroadcasterSubscriptionId, async (message: any) => {
      this.ngZone.run(async () => {
        console.log("received message");
        console.log(message);
        if (message.command === "ssoCallbackLastPass") {
          this.code = message.code;
          this.state = message.state;
          await this.processSso();
        }
      });
    });
  }

  ngOnDestroy() {
    this.broadcasterService.unsubscribe(BroadcasterSubscriptionId);
  }

  async sso() {
    const request = await this.client.createSigninRequest({
      state: { test: 123 },
      nonce: "randomstring123",
    });
    this.platformUtilsService.launchUri(request.url);
  }

  async processSso() {
    const query = "?code=" + this.code + "&state=" + this.state;
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
