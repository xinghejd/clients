import { CryptoService } from "../../platform/abstractions/crypto.service";
import { EncString } from "../../platform/models/domain/enc-string";

import { GeneratedPasswordHistory } from "./password/generated-password-history";

/** Strategy that decrypts a password history */
export class LegacyPasswordHistoryDecryptor {
  constructor(private cryptoService: CryptoService) {}

  /** Decrypts a password history. */
  async decrypt(history: GeneratedPasswordHistory[]): Promise<GeneratedPasswordHistory[]> {
    if (history == null || history.length === 0) {
      return Promise.resolve([]);
    }

    const promises = history.map(async (item) => {
      const decrypted = await this.cryptoService.decryptToUtf8(new EncString(item.password));
      return new GeneratedPasswordHistory(decrypted, item.date);
    });

    return await Promise.all(promises);
  }
}
