import { autofill } from "@bitwarden/desktop-napi";

export class NativeAutofillMain {
  async helloWorld(value: string): Promise<string> {
    return autofill.helloWorld(value);
  }
}
