import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { firstValueFrom } from "rxjs";

import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { FeatureFlag } from "@bitwarden/common/enums/feature-flag.enum";
import { ConfigService } from "@bitwarden/common/platform/abstractions/config/config.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { CollectionView } from "@bitwarden/common/vault/models/view/collection.view";

import {
  convertToPermission,
  getPermissionList,
} from "./../../../admin-console/organizations/shared/components/access-selector/access-selector.models";
import { VaultItemEvent } from "./vault-item-event";
import { RowHeightClass } from "./vault-items.component";

@Component({
  selector: "tr[appVaultCipherRow]",
  templateUrl: "vault-cipher-row.component.html",
})
export class VaultCipherRowComponent implements OnInit {
  protected RowHeightClass = RowHeightClass;

  /**
   * Flag to determine if the extension refresh feature flag is enabled.
   */
  protected extensionRefreshEnabled = false;

  @Input() disabled: boolean;
  @Input() cipher: CipherView;
  @Input() showOwner: boolean;
  @Input() showCollections: boolean;
  @Input() showGroups: boolean;
  @Input() showPremiumFeatures: boolean;
  @Input() useEvents: boolean;
  @Input() cloneable: boolean;
  @Input() organizations: Organization[];
  @Input() collections: CollectionView[];
  @Input() viewingOrgVault: boolean;
  @Input() canEditCipher: boolean;
  @Input() vaultBulkManagementActionEnabled: boolean;

  @Output() onEvent = new EventEmitter<VaultItemEvent>();

  @Input() checked: boolean;
  @Output() checkedToggled = new EventEmitter<void>();

  protected CipherType = CipherType;
  private permissionList = getPermissionList();
  private permissionPriority = [
    "canManage",
    "canEdit",
    "canEditExceptPass",
    "canView",
    "canViewExceptPass",
  ];

  constructor(
    private configService: ConfigService,
    private i18nService: I18nService,
  ) {}

  /**
   * Lifecycle hook for component initialization.
   * Checks if the extension refresh feature flag is enabled to provide to template.
   */
  async ngOnInit(): Promise<void> {
    this.extensionRefreshEnabled = await firstValueFrom(
      this.configService.getFeatureFlag$(FeatureFlag.ExtensionRefresh),
    );
  }

  protected get showTotpCopyButton() {
    return (
      (this.cipher.login?.hasTotp ?? false) &&
      (this.cipher.organizationUseTotp || this.showPremiumFeatures)
    );
  }

  protected get showFixOldAttachments() {
    return this.cipher.hasOldAttachments && this.cipher.organizationId == null;
  }

  protected get showAttachments() {
    return this.canEditCipher || this.cipher.attachments?.length > 0;
  }

  protected get showAssignToCollections() {
    return this.canEditCipher && !this.cipher.isDeleted;
  }

  protected get showClone() {
    return this.cloneable && !this.cipher.isDeleted;
  }

  protected get showEventLogs() {
    return this.useEvents && this.cipher.organizationId;
  }

  protected get isNotDeletedLoginCipher() {
    return this.cipher.type === this.CipherType.Login && !this.cipher.isDeleted;
  }

  protected get permissionText() {
    if (this.cipher.collectionIds.length > 1) {
      const filteredCollections = this.cipher.collectionIds.map((id) => {
        return this.collections.find((collection) => {
          if (collection.id === id) {
            return collection;
          }
        });
      });

      const labels = filteredCollections.map((collection) => {
        return this.permissionList.find((p) => p.perm === convertToPermission(collection))?.labelId;
      });

      const highestPerm = this.permissionPriority.find((perm) => labels.includes(perm));
      return this.i18nService.t(highestPerm);
    }

    if (this.cipher.collectionIds.length === 1) {
      const filteredCollection = this.collections.find((collection) => {
        if (collection.id === this.cipher.collectionIds[0]) {
          return collection;
        }
      });
      return this.i18nService.t(
        this.permissionList.find((p) => p.perm === convertToPermission(filteredCollection))
          ?.labelId,
      );
    }

    if (this.cipher.edit) {
      return this.i18nService.t("canEdit");
    } else if (this.cipher.viewPassword) {
      return this.i18nService.t("canView");
    }

    return this.i18nService.t("noAccess");
  }

  protected get showCopyPassword(): boolean {
    return this.isNotDeletedLoginCipher && this.cipher.viewPassword;
  }

  protected get showCopyTotp(): boolean {
    return this.isNotDeletedLoginCipher && this.showTotpCopyButton;
  }

  protected get showLaunchUri(): boolean {
    return this.isNotDeletedLoginCipher && this.cipher.login.canLaunch;
  }

  protected get disableMenu() {
    return (
      !(
        this.isNotDeletedLoginCipher ||
        this.showCopyPassword ||
        this.showCopyTotp ||
        this.showLaunchUri ||
        this.showAttachments ||
        this.showClone ||
        this.canEditCipher ||
        this.cipher.isDeleted
      ) && this.vaultBulkManagementActionEnabled
    );
  }

  protected copy(field: "username" | "password" | "totp") {
    this.onEvent.emit({ type: "copyField", item: this.cipher, field });
  }

  protected clone() {
    this.onEvent.emit({ type: "clone", item: this.cipher });
  }

  protected moveToOrganization() {
    this.onEvent.emit({ type: "moveToOrganization", items: [this.cipher] });
  }

  protected editCollections() {
    this.onEvent.emit({ type: "viewCipherCollections", item: this.cipher });
  }

  protected events() {
    this.onEvent.emit({ type: "viewEvents", item: this.cipher });
  }

  protected restore() {
    this.onEvent.emit({ type: "restore", items: [this.cipher] });
  }

  protected deleteCipher() {
    this.onEvent.emit({ type: "delete", items: [{ cipher: this.cipher }] });
  }

  protected attachments() {
    this.onEvent.emit({ type: "viewAttachments", item: this.cipher });
  }

  protected assignToCollections() {
    this.onEvent.emit({ type: "assignToCollections", items: [this.cipher] });
  }
}
