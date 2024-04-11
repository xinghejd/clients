import { FilelessImportPort } from "../enums/fileless-import.enums";

class CreepFilelessImporter {
  private featureEnabled: boolean = false;
  private hasExportNotificationDisplayed: boolean = false;
  private messagePort: chrome.runtime.Port;
  private mutationObserver: MutationObserver;
  private currentHref: string = "";
  private readonly portMessageHandlers: Record<string, any> = {
    verifyFeatureFlag: ({ message }: any) => this.handleFeatureFlagVerification(message),
    pingCreepExportRequest: ({ message }: any) => this.pingCreepExportRequest(message),
  };

  init() {
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
    this.currentHref = globalThis.location.href;
    this.mutationObserver = new MutationObserver(this.handleMutation);
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

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

  private handleMutation = () => {
    if (this.hasExportNotificationDisplayed) {
      this.mutationObserver.disconnect();
      return;
    }

    const creepMetaTag = globalThis.document.querySelector('meta[name="creep"]');
    const allowsCredentialExport = Boolean(creepMetaTag?.getAttribute("content"));
    if (allowsCredentialExport) {
      this.postPortMessage({ command: "displayCreepImportNotification" });
      this.hasExportNotificationDisplayed = true;
    }
  };

  pingCreepExportRequest = (message: { requestMessage: any }) => {
    if (!this.featureEnabled) {
      return;
    }

    globalThis.postMessage(message.requestMessage, "*");
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

  private postPortMessage(message: any) {
    this.messagePort?.postMessage(message);
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
