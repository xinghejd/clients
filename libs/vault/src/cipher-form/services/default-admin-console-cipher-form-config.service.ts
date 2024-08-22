import { inject, Injectable } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { combineLatest, firstValueFrom, map } from "rxjs";

import {
  canAccessOrgAdmin,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { PolicyService } from "@bitwarden/common/admin-console/abstractions/policy/policy.service.abstraction";
import { OrganizationUserStatusType, PolicyType } from "@bitwarden/common/admin-console/enums";
import { CipherId } from "@bitwarden/common/types/guid";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CollectionService } from "@bitwarden/common/vault/abstractions/collection.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { Cipher } from "@bitwarden/common/vault/models/domain/cipher";

import {
  CipherFormConfig,
  AdminConsoleCipherFormConfigService,
  CipherFormMode,
} from "../abstractions/cipher-form-config.service";

@Injectable()
export class DefaultAdminConsoleCipherFormConfigService
  implements AdminConsoleCipherFormConfigService
{
  private policyService: PolicyService = inject(PolicyService);
  private organizationService: OrganizationService = inject(OrganizationService);
  private cipherService: CipherService = inject(CipherService);
  private collectionService: CollectionService = inject(CollectionService);
  private route: ActivatedRoute = inject(ActivatedRoute);

  async buildConfig(
    mode: CipherFormMode,
    cipherId?: CipherId,
    cipherType?: CipherType,
  ): Promise<CipherFormConfig> {
    const [organizations, collections, allowPersonalOwnership, cipher] = await firstValueFrom(
      combineLatest([
        this.organizations$,
        this.collectionService.decryptedCollections$,
        this.allowPersonalOwnership$,
        this.getCipher(cipherId),
      ]),
    );

    const isAdmin = organizations.some(canAccessOrgAdmin);

    return {
      mode,
      cipherType: cipher?.type ?? cipherType ?? CipherType.Login,
      admin: isAdmin,
      allowPersonalOwnership,
      originalCipher: cipher,
      collections,
      organizations,
      folders: [], // No folders in Admin Console
    };
  }

  private organizations$ = this.organizationService.organizations$.pipe(
    map((orgs) =>
      orgs.filter(
        (o) => o.isMember && o.enabled && o.status === OrganizationUserStatusType.Confirmed,
      ),
    ),
  );

  private allowPersonalOwnership$ = this.policyService
    .policyAppliesToActiveUser$(PolicyType.PersonalOwnership)
    .pipe(map((p) => !p));

  private getCipher(id?: CipherId): Promise<Cipher | null> {
    if (id == null) {
      return Promise.resolve(null);
    }
    return this.cipherService.get(id);
  }
}
