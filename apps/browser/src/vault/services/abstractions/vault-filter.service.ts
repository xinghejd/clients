import { VaultFilter } from "@bitwarden/angular/vault/vault-filter/models/vault-filter.model";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

import { VaultFilterService } from "../vault-filter.service";

export abstract class VaultFilterServiceAbstraction extends VaultFilterService {
  vaultFilter: VaultFilter;
  allVaults: string;
  myVault: string;
  getVaultFilter: () => VaultFilter;
  setVaultFilter: (filter: string) => void;
  clear: () => void;
  filterCipherForSelectedVault: (cipher: CipherView) => boolean;
}
