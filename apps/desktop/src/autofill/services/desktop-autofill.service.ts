export class DesktopAutofillService {
  async init() {
    (window as any).testAutofill = () => this.sync();
  }

  async sync() {
    await ipc.autofill.sync();
  }
}
