import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit, OnDestroy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Subject } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherId } from "@bitwarden/common/types/guid";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { AsyncActionsModule, DialogModule, DialogService, ItemModule } from "@bitwarden/components";
import {
  CipherAttachmentsComponent,
  CipherFormConfig,
  CipherFormGenerationService,
  CipherFormMode,
  CipherFormModule,
} from "@bitwarden/vault";

import { WebCipherFormGenerationService } from "../../../../../../libs/vault/src/cipher-form/services/web-cipher-form-generation.service";
import { CipherViewComponent } from "../../../../../../libs/vault/src/cipher-view/cipher-view.component";
import { SharedModule } from "../../shared/shared.module";

import { AttachmentsV2Component } from "./attachments-v2.component";

/**
 * Parameters for the AddEditCipherDialogV2 component.
 */
export interface AddEditCipherDialogParams {
  /**
   * The cipher to edit.
   */
  cipher: CipherView;
  /**
   * The type of the cipher.
   */
  cipherType?: CipherType;
  /**
   * Whether the cipher is being cloned.
   */
  cloneMode?: boolean;
  /**
   * The configuration for the cipher form.
   */
  cipherFormConfig: CipherFormConfig;
}

/**
 * The result of the AddEditCipherDialogV2 component.
 */
export enum AddEditCipherDialogResult {
  Edited = "edited",
  Deleted = "deleted",
  Added = "added",
  Canceled = "canceled",
}

/**
 * The close result of the AddEditCipherDialogV2 component.
 */
export interface AddEditCipherDialogCloseResult {
  action: AddEditCipherDialogResult;
}

/**
 * Component for viewing a cipher, presented in a dialog.
 */
@Component({
  selector: "app-vault-add-edit-v2",
  templateUrl: "add-edit-v2.component.html",
  standalone: true,
  imports: [
    CipherViewComponent,
    CommonModule,
    AsyncActionsModule,
    DialogModule,
    SharedModule,
    CipherFormModule,
    CipherAttachmentsComponent,
    ItemModule,
  ],
  providers: [{ provide: CipherFormGenerationService, useClass: WebCipherFormGenerationService }],
})
export class AddEditComponentV2 implements OnInit, OnDestroy {
  cipher: CipherView;
  cipherId: CipherId;
  organization: Organization;
  config: CipherFormConfig;
  headerText: string;
  cipherType: CipherType;
  cloneMode: boolean = false;
  protected destroy$ = new Subject<void>();
  canAccessAttachments: boolean = false;

  /**
   * Constructor for the AddEditComponentV2 component.
   * @param params The parameters for the component.
   * @param dialogRef The reference to the dialog.
   * @param i18nService The internationalization service.
   * @param dialogService The dialog service.
   * @param organizationService The organization service.
   * @param billingAccountProfileStateService The billing account profile state service.
   */
  constructor(
    @Inject(DIALOG_DATA) public params: AddEditCipherDialogParams,
    private dialogRef: DialogRef<AddEditCipherDialogCloseResult>,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private organizationService: OrganizationService,
    private billingAccountProfileStateService: BillingAccountProfileStateService,
  ) {
    this.billingAccountProfileStateService.hasPremiumFromAnySource$
      .pipe(takeUntilDestroyed())
      .subscribe((canAccessPremium) => {
        this.canAccessAttachments = canAccessPremium;
      });
  }

  /**
   * Lifecycle hook for component initialization.
   */
  async ngOnInit() {
    this.cipher = this.params.cipher;
    this.cipherId = this.cipher?.id as CipherId;
    this.cipherType = this.params.cipherType || this.params.cipherFormConfig?.cipherType;
    this.cloneMode = this.params.cloneMode || false;
    this.config = this.params.cipherFormConfig;

    if (this.cipher && this.cipher.organizationId) {
      this.organization = await this.organizationService.get(this.cipher.organizationId);
    }

    this.headerText = this.setHeader(this.config?.mode, this.cipherType);
  }

  /**
   * Lifecycle hook for component destruction.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Getter to check if the component is loading.
   */
  get loading() {
    return this.config == null;
  }

  /**
   * Method to handle cancel action. Called when a user clicks the cancel button.
   */
  async cancel() {
    this.dialogRef.close({ action: AddEditCipherDialogResult.Canceled });
  }

  /**
   * Sets the header text based on the mode and type of the cipher.
   * @param mode The form mode.
   * @param type The cipher type.
   * @returns The header text.
   */
  setHeader(mode: CipherFormMode, type: CipherType) {
    const partOne = mode === "edit" || mode === "partial-edit" ? "editItemHeader" : "newItemHeader";
    switch (type) {
      case CipherType.Login:
        return this.i18nService.t(partOne, this.i18nService.t("typeLogin").toLowerCase());
      case CipherType.Card:
        return this.i18nService.t(partOne, this.i18nService.t("typeCard").toLowerCase());
      case CipherType.Identity:
        return this.i18nService.t(partOne, this.i18nService.t("typeIdentity").toLowerCase());
      case CipherType.SecureNote:
        return this.i18nService.t(partOne, this.i18nService.t("note").toLowerCase());
    }
  }

  /**
   * Opens the attachments dialog.
   */
  async openAttachmentsDialog() {
    this.dialogService.open<AttachmentsV2Component, { cipherId: CipherId }>(
      AttachmentsV2Component,
      {
        data: {
          cipherId: this.cipherId,
        },
      },
    );
  }
}

/**
 * Strongly typed helper to open a cipher add/edit dialog
 * @param dialogService Instance of the dialog service that will be used to open the dialog
 * @param config Configuration for the dialog
 * @returns A reference to the opened dialog
 */
export function openAddEditCipherDialog(
  dialogService: DialogService,
  config: DialogConfig<AddEditCipherDialogParams>,
): DialogRef<AddEditCipherDialogCloseResult> {
  return dialogService.open(AddEditComponentV2, config);
}
