export class DesktopAutofillService {
  async init() {
    (window as any).testAutofill = () => this.sync();
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
