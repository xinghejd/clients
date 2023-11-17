import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class WebauthnPlatformApiService {
  create(): Promise<string> {
    return ipc.platform.webauthn.create();
  }
}
