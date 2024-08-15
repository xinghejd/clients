import { DialogRef, DIALOG_DATA } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject } from "@angular/core";

import { CipherId } from "@bitwarden/common/types/guid";
import { CipherAttachmentsComponent } from "@bitwarden/vault";

import { SharedModule } from "../../shared";

export interface AttachmentsDialogParams {
  cipherId: CipherId;
}

export enum AttachmentDialogResult {
  uploaded = "uploaded",
  closed = "closed",
}

export interface AttachmentDialogCloseResult {
  action: AttachmentDialogResult;
}

@Component({
  selector: "app-vault-attachments-v2",
  templateUrl: "attachments-v2.component.html",
  standalone: true,
  imports: [CommonModule, SharedModule, CipherAttachmentsComponent],
})
export class AttachmentsV2Component {
  cipherId: CipherId;

  constructor(
    private dialogRef: DialogRef<AttachmentDialogCloseResult>,
    @Inject(DIALOG_DATA) public params: AttachmentsDialogParams,
  ) {
    this.cipherId = params.cipherId;
  }

  uploadSuccessful() {
    this.dialogRef.close({
      action: AttachmentDialogResult.uploaded,
    });
  }
}
