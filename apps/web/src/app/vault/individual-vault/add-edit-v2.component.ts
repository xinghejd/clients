import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit, EventEmitter, OnDestroy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { map, Subject, switchMap, takeUntil } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { BillingAccountProfileStateService } from "@bitwarden/common/billing/abstractions";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherId } from "@bitwarden/common/types/guid";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { AsyncActionsModule, DialogModule, DialogService, ItemModule } from "@bitwarden/components";
import {
  CipherAttachmentsComponent,
  CipherFormConfig,
  CipherFormConfigService,
  CipherFormGenerationService,
  CipherFormMode,
  CipherFormModule,
  DefaultCipherFormConfigService,
} from "@bitwarden/vault";

import { CipherFormQueryParams } from "../../../../../../libs/vault/src/cipher-form/cipher-form-query-params";
import { WebCipherFormGenerationService } from "../../../../../../libs/vault/src/cipher-form/services/web-cipher-form-generation.service";
import { CipherViewComponent } from "../../../../../../libs/vault/src/cipher-view/cipher-view.component";
import { SharedModule } from "../../shared/shared.module";

import {
  AttachmentDialogCloseResult,
  AttachmentDialogResult,
  AttachmentsV2Component,
} from "./attachments-v2.component";

export interface AddEditCipherDialogParams {
  cipher?: CipherView;
  cipherType?: CipherType;
  cloneMode?: boolean;
}

export enum AddEditCipherDialogResult {
  Edited = "edited",
  Deleted = "deleted",
  Added = "added",
}

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
  providers: [
    { provide: CipherFormConfigService, useClass: DefaultCipherFormConfigService },
    { provide: CipherFormGenerationService, useClass: WebCipherFormGenerationService },
  ],
})
export class AddEditComponentV2 implements OnInit, OnDestroy {
  cipher: CipherView;
  cipherId: CipherId;
  deletePromise: Promise<void>;
  onDeletedCipher = new EventEmitter<CipherView>();
  onSavedCipher = new EventEmitter<CipherView>();
  cipherTypeString: string;
  cipherEditUrl: string;
  organization: Organization;
  flexibleCollectionsV1Enabled = false;
  restrictProviderAccess = false;
  config: CipherFormConfig;
  headerText: string;
  cipherType: CipherType;
  editMode: boolean = false;
  cloneMode: boolean = false;
  protected destroy$ = new Subject<void>();
  canAccessAttachments: boolean = false;

  constructor(
    @Inject(DIALOG_DATA) public params: AddEditCipherDialogParams,
    private dialogRef: DialogRef<AddEditCipherDialogCloseResult>,
    private attachmentDialogRef: DialogRef<AttachmentDialogCloseResult>,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private messagingService: MessagingService,
    private organizationService: OrganizationService,
    private router: Router,
    private addEditFormConfigService: CipherFormConfigService,
    private route: ActivatedRoute,
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
    this.cipherType = this.params.cipherType;
    this.cloneMode = this.params.cloneMode;
    this.subscribeToParams();

    if (this.cipher && this.cipher.organizationId) {
      this.organization = await this.organizationService.get(this.cipher.organizationId);
    }
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
   * Subscribes to route query parameters and updates the form configuration accordingly.
   */
  subscribeToParams(): void {
    this.route.queryParams
      .pipe(
        map((params) => new CipherFormQueryParams(params)),
        switchMap(async (params) => {
          let mode: CipherFormMode;
          const cipherId = (getCipherIdFromParams(params) || this.cipher?.id) as CipherId;
          const cipherType = (params.type || this.cipherType) as CipherType;
          if (cipherId == null) {
            mode = "add";
            this.editMode = true;
          } else {
            mode = params.clone || this.cloneMode ? "clone" : "edit";
          }
          const config = await this.addEditFormConfigService.buildConfig(
            mode,
            cipherId,
            cipherType,
          );

          if (config.mode === "edit" && !config.originalCipher.edit) {
            config.mode = "partial-edit";
          }

          this.setInitialValuesFromParams(params, config);

          return config;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((config) => {
        this.config = config;
        this.headerText = this.setHeader(config.mode, config.cipherType);
      });
  }

  /**
   * Sets initial values for the form configuration based on query parameters.
   * @param params The query parameters.
   * @param config The form configuration.
   */
  setInitialValuesFromParams(params: CipherFormQueryParams, config: CipherFormConfig) {
    config.initialValues = {};
    if (params.folderId) {
      config.initialValues.folderId = params.folderId;
    }
    if (params.organizationId) {
      config.initialValues.organizationId = params.organizationId;
    }
    if (params.collectionId) {
      config.initialValues.collectionIds = [params.collectionId];
    }
    if (params.uri) {
      config.initialValues.loginUri = params.uri;
    }
    if (params.username) {
      config.initialValues.username = params.username;
    }
    if (params.name) {
      config.initialValues.name = params.name;
    }
  }

  /**
   * Handles the event when a cipher is saved.
   * @param cipher The saved cipher.
   */
  async onCipherSaved(cipher: CipherView) {
    let action = AddEditCipherDialogResult.Added;
    if (cipher.edit) {
      action = AddEditCipherDialogResult.Edited;
    }

    this.dialogRef.close({ action });
    this.onSavedCipher.emit(this.cipher);
    this.messagingService.send(this.editMode && !this.cloneMode ? "editedCipher" : "addedCipher");
    await this.router.navigate([], {
      queryParams: {
        itemId: null,
        action: null,
      },
    });
  }

  /**
   * Method to handle cipher editing. Called when a user clicks the edit button.
   */
  async edit(): Promise<void> {
    this.dialogRef.close({ action: AddEditCipherDialogResult.Edited });
    await this.router.navigate([], {
      queryParams: {
        itemId: this.cipher.id,
        action: "edit",
        organizationId: this.cipher.organizationId,
      },
    });
  }

  /**
   * Method to handle cancel action. Called when a user clicks the cancel button.
   */
  async cancel() {
    this.dialogRef.close();
    await this.router.navigate([], {
      queryParams: {
        itemId: null,
        action: null,
        organizationId: null,
      },
    });
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

  /**
   * Closes the attachments dialog.
   */
  closeAttachmentsDialog() {
    this.attachmentDialogRef.close({ action: AttachmentDialogResult.Closed });
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

/**
 * Allows backwards compatibility with
 * old links that used the original `cipherId` param
 * @param params The query parameters.
 * @returns The cipher ID.
 */
const getCipherIdFromParams = (params: Params): string => {
  return params["itemId"] || params["cipherId"];
};
