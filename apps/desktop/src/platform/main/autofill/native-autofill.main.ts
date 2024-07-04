import { autofill } from "@bitwarden/desktop-napi";

export class NativeAutofillMain {
  async init() {
    if (process.env.NODE_ENV === "development") {
      console.log("=====================================");
      console.log("Testing autofill native module");
      try {
        console.log(
          "Running helloWorld - return value: ",
          await this.helloWorld("String from Electron"),
        );
      } catch (e) {
        console.error("Error running helloWorld: ", e);
      }
      console.log("=====================================");
    }
  }

  async helloWorld(value: string): Promise<string> {
    return autofill.helloWorld(value);
  }
}
