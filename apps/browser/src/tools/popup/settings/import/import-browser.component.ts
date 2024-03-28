import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { Router, RouterLink } from "@angular/router";

import { JslibModule } from "@bitwarden/angular/jslib.module";
import { AsyncActionsModule, ButtonModule, DialogModule } from "@bitwarden/components";
import { ImportComponent } from "@bitwarden/importer/ui";

import { nordpassExampleString } from "../../../../../../../libs/importer/spec/test-data/cef/example-from-nordpass";
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

  constructor(private router: Router) {
    BrowserApi.addListener(chrome.runtime.onMessage, (message) => {
      if (message.command !== "creepImportResponse") {
        return;
      }

      // TODO: Capture creep response from message.data
      // this.creepResponse = message.data;
      this.creepResponse = nordpassExampleString;
    });
  }

  protected async onSuccessfulImport(organizationId: string): Promise<void> {
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.router.navigate(["/tabs/settings"]);
  }

  protected async sendCreepRequest(): Promise<void> {
    // TODO: Create Valid CREEP Request message
    const requestMessage = {
      type: "creepExportRequest",
      content: {
        version: 0,
        hpke: ["..."], // includes public-key
        zip: ["zip"],
        importer: "Bitwarden",
        credentialTypes: [] as any[],
      },
    };

    await chrome.runtime.sendMessage({
      command: "initiateCreepRequest",
      requestMessage,
    });
  }
}
