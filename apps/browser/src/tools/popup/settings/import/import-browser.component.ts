import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { AeadId, CipherSuite, KdfId, KemId } from "hpke-js";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AsyncActionsModule, ButtonModule, DialogModule } from "@bitwarden/components";
import { ImportComponent } from "@bitwarden/importer/ui";

import { BrowserApi } from "../../../../platform/browser/browser-api";

@Component({
  templateUrl: "import-browser.component.html",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    JslibModule,
    DialogModule,
    AsyncActionsModule,
    ButtonModule,
    ImportComponent,
  ],
})
export class ImportBrowserComponent {
  protected disabled = false;
  protected loading = false;
  protected creepResponse: any;
  private rkp: CryptoKeyPair;
  suite: CipherSuite;

  constructor(private router: Router) {
    BrowserApi.addListener(chrome.runtime.onMessage, async (message) => {
      if (message.command !== "creepImportResponse") {
        return;
      }

      // TODO: Capture creep response from message.data

      (window as any).suite = this.suite;
      (window as any).rkp = this.rkp;

      this.creepResponse = message.data;
      //this.creepResponse = nordpassExampleString;
    });
  }

  protected async onSuccessfulImport(organizationId: string): Promise<void> {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/tabs/settings"]);
  }

  protected async sendCreepRequest(): Promise<void> {
    this.suite = new CipherSuite({
      kem: KemId.DhkemP256HkdfSha256,
      kdf: KdfId.HkdfSha256,
      aead: AeadId.Aes128Gcm,
    });

    this.rkp = await this.suite.kem.generateKeyPair();

    const pubKey = await window.crypto.subtle.exportKey("jwk", this.rkp.publicKey);

    // TODO: Create Valid CREEP Request message
    const requestMessage = {
      type: "creepExportRequest",
      content: {
        version: 0,
        hpke: [
          {
            mode: "base",
            kem: KemId.DhkemP256HkdfSha256,
            kdf: KdfId.HkdfSha256,
            aead: AeadId.Aes128Gcm,
            key: pubKey,
          },
        ], // includes public-key
        //*/
        //hpke: [""],
        zip: ["zip"],
        importer: "Bitwarden",
        credentialTypes: ["basic-auth", "passkey"],
      },
    };

    await chrome.runtime.sendMessage({
      command: "initiateCreepRequest",
      requestMessage,
    });
  }
}
