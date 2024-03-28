import { FilelessImportPort } from "../enums/fileless-import.enums";

class CreepFilelessImporter {
  private featureEnabled: boolean = false;
  // private currentLocationHref: string = "";
  private messagePort: chrome.runtime.Port;
  private readonly portMessageHandlers: Record<string, any> = {
    verifyFeatureFlag: ({ message }: any) => this.handleFeatureFlagVerification(message),
    pingCreepExportRequest: ({ message }: any) => this.pingCreepExportRequest(message),
  };

  init() {
    // this.currentLocationHref = globalThis.location.href;
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
    this.setupMessagePort();
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
  };

  pingCreepExportRequest = (message: { requestMessage: any }) => {
    if (!this.featureEnabled) {
      return;
    }

    globalThis.postMessage(message.requestMessage, "*");

    // TODO: This is a mocked response for testing purposes. Remove this when the hpkey value is actually setup correctly. Expect the window.onMessage handler to be called with the correct data.
    setTimeout(() => {
      const modalButton = document.querySelector(
        "div.ReactModal__Content--after-open.modal button.np-ui-button--contained.np-ui-button--secondary-variant",
      );
      modalButton?.addEventListener("click", () => {
        window.postMessage(
          {
            type: "creepExportResponse",
            content: {
              version: 0,
              hpke: ["..."], // includes public-key
              zip: ["zip"],
              importer: "Bitwarden",
              credentialTypes: [],
            },
          },
          "*",
        );
      });
    }, 100);
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
