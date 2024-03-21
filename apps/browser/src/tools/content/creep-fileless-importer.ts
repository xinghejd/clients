import { FilelessImportPort } from "../enums/fileless-import.enums";

class CreepFilelessImporter {
  private featureEnabled: boolean = false;
  private currentLocationHref: string = "";
  private messagePort: chrome.runtime.Port;
  private readonly portMessageHandlers: Record<string, any> = {
    verifyFeatureFlag: ({ message }: any) => this.handleFeatureFlagVerification(message),
  };

  init() {
    this.currentLocationHref = globalThis.location.href;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", this.loadImporter);
      return;
    }

    this.loadImporter();
  }

  private handleFeatureFlagVerification(message: any) {
    if (!message.filelessImportEnabled) {
      this.messagePort?.disconnect();
    }

    this.featureEnabled = message.filelessImportEnabled;
  }

  private loadImporter = () => {
    window.addEventListener("message", (event) => {
      const { data } = event;
      if (!data || !data.type) {
        return;
      }

      if (data.type === "creepExportResponse") {
        const closeModalButton = document.querySelector("#modal-close-button") as HTMLButtonElement;
        if (closeModalButton) {
          closeModalButton.click();
        }

        this.messagePort?.postMessage({
          command: "startCreepFilelessImport",
          data: data.content,
        });
      }
    });

    this.currentLocationHref = globalThis.location.href;
    document.body.addEventListener(
      "click",
      () => {
        requestAnimationFrame(() => {
          if (this.currentLocationHref !== globalThis.location.href) {
            this.setupMessagePort();
            this.currentLocationHref = globalThis.location.href;

            if (this.currentLocationHref.includes("/export")) {
              this.pingCreepExportRequest();
            }
          }
        });
      },
      true,
    );
  };

  pingCreepExportRequest = () => {
    if (!this.featureEnabled) {
      return;
    }

    globalThis.postMessage(
      {
        type: "creepExportRequest",
        content: {
          version: 0,
          hpke: "...", // includes public-key
          zip: "...",
          importer: "Bitwarden",
          credentialTypes: [],
        },
      },
      "*",
    );
  };

  private setupMessagePort() {
    if (this.messagePort) {
      return;
    }

    this.messagePort = chrome.runtime.connect({ name: FilelessImportPort.CREEPImporter });
    this.messagePort.onMessage.addListener(this.handlePortMessage);
    this.messagePort.onDisconnect.addListener(() => {
      this.messagePort = null;
    });
  }

  private handlePortMessage = (message: any, port: chrome.runtime.Port) => {
    const handler = this.portMessageHandlers[message.command];
    if (!handler) {
      return;
    }

    handler({ message, port });
  };
}
(function () {
  if (!(globalThis as any).creepFilelessImporter) {
    (globalThis as any).creepFilelessImporter = new CreepFilelessImporter();
    (globalThis as any).creepFilelessImporter.init();
  }
})();
