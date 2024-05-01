import { firstValueFrom } from "rxjs";

import { UserVerificationDialogComponent } from "@bitwarden/auth/angular";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { DialogService } from "@bitwarden/components";
import { PasswordRepromptService } from "@bitwarden/vault";

import { SetPinComponent } from "../../auth/popup/components/set-pin.component";

export class Fido2UserVerificationService {
  constructor(
    private passwordRepromptService: PasswordRepromptService,
    private dialogService: DialogService,
  ) {}

  /**
   * Handles user verification for a user based on the cipher and user verification requested.
   * @param userVerificationRequested Indicates if user verification is required or not.
   * @param cipher Contains details about the cipher including master password reprompt.
   * @param fromLock Indicates if the request is from the lock screen.
   * @returns
   */
  async handleUserVerification(
    userVerificationRequested: boolean,
    cipher: CipherView,
    fromLock: boolean,
  ): Promise<boolean> {
    const masterPasswordRepromptRequired = cipher && cipher.reprompt !== 0;

    // If the request is from the lock screen, treat unlocking the vault as user verification,
    // unless a master password reprompt is required.
    if (fromLock) {
      return masterPasswordRepromptRequired
        ? await this.showMasterPasswordReprompt()
        : userVerificationRequested;
    }

    if (masterPasswordRepromptRequired) {
      return await this.showMasterPasswordReprompt();
    }

    if (userVerificationRequested) {
      return await this.showUserVerificationDialog();
    }

    return userVerificationRequested;
  }

  private async showMasterPasswordReprompt(): Promise<boolean> {
    return await this.passwordRepromptService.showPasswordPrompt();
  }

  private async showUserVerificationDialog(): Promise<boolean> {
    const result = await UserVerificationDialogComponent.open(this.dialogService, {
      clientSideOnlyVerification: true,
    });

    if (result.userAction === "cancel") {
      return;
    }

    // Handle unsuccessful verification attempts.
    if (!result.verificationSuccess) {
      // Check if no client-side verification methods are available.
      if (result.noAvailableClientVerificationMethods) {
        return await this.promptUserToSetPin();
      }
      return;
    }

    return result.verificationSuccess;
  }

  private async promptUserToSetPin() {
    const dialogRef = SetPinComponent.open(this.dialogService);

    if (!dialogRef) {
      return;
    }

    const userHasPinSet = await firstValueFrom(dialogRef.closed);

    if (!userHasPinSet) {
      return;
    }

    // If the user has set a PIN, re-invoke the user verification dialog to complete the verification process.
    return await this.showUserVerificationDialog();
  }
}
