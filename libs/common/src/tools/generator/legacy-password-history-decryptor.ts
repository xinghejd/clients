import { CryptoService } from "../../platform/abstractions/crypto.service";
import { EncString } from "../../platform/models/domain/enc-string";

import { GeneratedPasswordHistory } from "./password/generated-password-history";

/** Strategy that decrypts a password history */
export class LegacyPasswordHistoryDecryptor {
  constructor(private cryptoService: CryptoService) {}

  /** Decrypts a password history. */
  decrypt(history: GeneratedPasswordHistory[]): Promise<GeneratedPasswordHistory[]> {
    // this code uses `decryptToUtf8` because the legacy service does
    const promises = (history ?? []).map(async (item) => {
      const encrypted = new EncString(item.password);
      const decrypted = await this.cryptoService.decryptToUtf8(encrypted);
      return new GeneratedPasswordHistory(decrypted, item.date);
    });

    return Promise.all(promises);
  }
}
