import { DIALOG_DATA, DialogConfig, DialogRef } from "@angular/cdk/dialog";
import { CommonModule } from "@angular/common";
import { Component, Inject, OnInit, EventEmitter, OnDestroy } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { map, Subject, switchMap, takeUntil } from "rxjs";

import { OrganizationService } from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { MessagingService } from "@bitwarden/common/platform/abstractions/messaging.service";
import { CipherId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums/cipher-type";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import {
  AsyncActionsModule,
  DialogModule,
  DialogService,
  ToastService,
} from "@bitwarden/components";
import {
  CipherFormConfig,
  CipherFormConfigService,
  CipherFormGenerationService,
  CipherFormMode,
  CipherFormModule,
  DefaultCipherFormConfigService,
} from "@bitwarden/vault";

import { QueryParams } from "../../../../../../libs/angular/src/utils/add-edit-query-params";
import { DefaultCipherFormGenerationService } from "../../../../../../libs/vault/src/cipher-form/services/default-cipher-form-generation.service";
import { CipherViewComponent } from "../../../../../../libs/vault/src/cipher-view/cipher-view.component";
import { SharedModule } from "../../shared/shared.module";

export interface AddEditCipherDialogParams {
  cipher?: CipherView;
  cipherType?: CipherType;
  cloneMode?: boolean;
}

export enum AddEditCipherDialogResult {
  edited = "edited",
  deleted = "deleted",
  added = "added",
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
  ],
  providers: [
    { provide: CipherFormConfigService, useClass: DefaultCipherFormConfigService },
    { provide: CipherFormGenerationService, useClass: DefaultCipherFormGenerationService },
  ],
})
export class AddEditComponentV2 implements OnInit, OnDestroy {
  cipher: CipherView;
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

  constructor(
    @Inject(DIALOG_DATA) public params: AddEditCipherDialogParams,
    private dialogRef: DialogRef<AddEditCipherDialogCloseResult>,
    private i18nService: I18nService,
    private dialogService: DialogService,
    private messagingService: MessagingService,
    private logService: LogService,
    private cipherService: CipherService,
    private toastService: ToastService,
    private organizationService: OrganizationService,
    private router: Router,
    private addEditFormConfigService: CipherFormConfigService,
    private route: ActivatedRoute,
  ) {}

  /**
   * Lifecycle hook for component initialization.
   */
  async ngOnInit() {
    this.cipher = this.params.cipher;
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

  get loading() {
    return this.config == null;
  }

  subscribeToParams(): void {
    this.route.queryParams
      .pipe(
        map((params) => new QueryParams(params)),
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

  setInitialValuesFromParams(params: QueryParams, config: CipherFormConfig) {
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

  async onCipherSaved(cipher: CipherView) {
    let action = AddEditCipherDialogResult.added;
    if (cipher.edit) {
      action = AddEditCipherDialogResult.edited;
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
   * Method to handle cipher deletion. Called when a user clicks the delete button.
   */
  async delete(): Promise<void> {
    const confirmed = await this.dialogService.openSimpleDialog({
      title: { key: "deleteItem" },
      content: {
        key: this.cipher.isDeleted ? "permanentlyDeleteItemConfirmation" : "deleteItemConfirmation",
      },
      type: "warning",
    });

    if (!confirmed) {
      return;
    }

    try {
      this.deletePromise = this.deleteCipher();
      await this.deletePromise;
      this.toastService.showToast({
        variant: "success",
        title: this.i18nService.t("success"),
        message: this.i18nService.t(
          this.cipher.isDeleted ? "permanentlyDeletedItem" : "deletedItem",
        ),
      });
      this.onDeletedCipher.emit(this.cipher);
      this.messagingService.send(
        this.cipher.isDeleted ? "permanentlyDeletedCipher" : "deletedCipher",
      );
    } catch (e) {
      this.logService.error(e);
    }

    this.dialogRef.close({ action: AddEditCipherDialogResult.deleted });
  }

  /**
   * Helper method to delete cipher.
   */
  protected async deleteCipher(): Promise<void> {
    const asAdmin = this.organization?.canEditAllCiphers(this.flexibleCollectionsV1Enabled);
    if (this.cipher.isDeleted) {
      await this.cipherService.deleteWithServer(this.cipher.id, asAdmin);
    } else {
      await this.cipherService.softDeleteWithServer(this.cipher.id, asAdmin);
    }
  }

  /**
   * Method to handle cipher editing. Called when a user clicks the edit button.
   */
  async edit(): Promise<void> {
    this.dialogRef.close({ action: AddEditCipherDialogResult.edited });
    await this.router.navigate([], {
      queryParams: {
        itemId: this.cipher.id,
        action: "edit",
        organizationId: this.cipher.organizationId,
      },
    });
  }

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
 */
const getCipherIdFromParams = (params: Params): string => {
  return params["itemId"] || params["cipherId"];
};
