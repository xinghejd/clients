import { Overlay } from "@angular/cdk/overlay";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { DialogService } from "@bitwarden/components";
import { CipherFormGenerationService } from "@bitwarden/vault";

import { WebVaultGeneratorDialogComponent } from "../individual-vault/generator-dialog.component";

@Injectable()
export class WebCipherFormGenerationService implements CipherFormGenerationService {
  private dialogService = inject(DialogService);
  private overlay = inject(Overlay);

  async generatePassword(): Promise<string> {
    const dialogRef = WebVaultGeneratorDialogComponent.open(this.dialogService, this.overlay, {
      data: { type: "password" },
    });

    const result = await firstValueFrom(dialogRef.closed);

    if (result == null || result.action === "canceled") {
      return null;
    }

    return result.generatedValue;
  }

  async generateUsername(): Promise<string> {
    const dialogRef = WebVaultGeneratorDialogComponent.open(this.dialogService, this.overlay, {
      data: { type: "username" },
    });

    const result = await firstValueFrom(dialogRef.closed);

    if (result == null || result.action === "canceled") {
      return null;
    }

    return result.generatedValue;
  }
}
