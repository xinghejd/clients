export class DesktopAutofillService {
  async init() {
    (window as any).testAutofill = () => this.status();
  }

  async status() {
    const result = await ipc.autofill.runCommand({
      command: "status",
      params: {},
    });

    if (result.type === "error") {
      // eslint-disable-next-line no-console
      console.error("Status error:", result.error);
    } else {
      // eslint-disable-next-line no-console
      console.log("Status result:", result.value);
    }
  }

  async sync() {
    const syncResult = await ipc.autofill.runCommand({
      command: "sync",
      params: {
        credentials: [
          {
            type: "fido2",
          },
          {
            type: "password",
          },
        ],
      },
    });

    if (syncResult.type === "error") {
      // eslint-disable-next-line no-console
      console.error("Sync error", syncResult.error);
    } else {
      // eslint-disable-next-line no-console
      console.log("Sync result", syncResult.value);
    }
  }
}
