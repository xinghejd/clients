import { firstValueFrom } from "rxjs";

import { DefaultLockComponentService, LockComponentService } from "@bitwarden/auth/angular";

import { BiometricErrors, BiometricErrorTypes } from "../models/biometricErrors";
import {
  fido2PopoutSessionData$,
  Fido2SessionData,
} from "../vault/popup/utils/fido2-popout-session-data";

export class ExtensionLockComponentService
  extends DefaultLockComponentService
  implements LockComponentService
{
  async isFido2Session(): Promise<boolean> {
    const fido2SessionData: Fido2SessionData = await firstValueFrom(fido2PopoutSessionData$());
    return fido2SessionData.isFido2Session;
  }

  getBiometricsError(error: any): string | null {
    const biometricsError = BiometricErrors[error?.message as BiometricErrorTypes];

    if (!biometricsError) {
      return null;
    }

    return biometricsError.description;
  }
}
