import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

type CipherHealth = {
  item: CipherView;
  health: {
    passwordLeaked: number;
    passwordReuse: number;
  };
};

export class HealthDashboardService {
  constructor(
    private cipherService: CipherService,
    private auditService: AuditService,
  ) {}

  async getHealth(): Promise<CipherHealth[]> {
    const ciphers = await this.cipherService.getAllDecrypted();
    const loginCiphers = ciphers.filter((c) => c.type === CipherType.Login && !c.isDeleted);

    const passwordReuseMap = await this.countPasswordReuse(loginCiphers);
    const passwordLeakedMap = await this.countPasswordLeaked(loginCiphers);

    const metadata = loginCiphers.map((c) => ({
      item: c,
      health: {
        passwordLeaked: passwordLeakedMap.get(c.id) ?? 0,
        passwordReuse: passwordReuseMap.get(c.id) ?? 0,
      },
    }));

    return metadata.filter((m) => m.health.passwordReuse > 1 || m.health.passwordLeaked > 0);
  }

  private async countPasswordReuse(ciphers: CipherView[]): Promise<Map<string, number>> {
    const passwordUseMap = new Map<string, number>();

    ciphers.forEach((cipher) => {
      const { login, edit, viewPassword } = cipher;
      if (Utils.isNullOrEmpty(login.password) || !edit || !viewPassword) {
        return;
      }

      if (passwordUseMap.has(login.password)) {
        passwordUseMap.set(login.password, passwordUseMap.get(login.password) + 1);
      } else {
        passwordUseMap.set(login.password, 1);
      }
    });

    return new Map(
      ciphers.map((c) => {
        const reuse = passwordUseMap.get(c.login?.password) ?? 0;
        return [c.id, reuse > 1 ? reuse : 0];
      }),
    );
  }

  private async countPasswordLeaked(ciphers: CipherView[]): Promise<Map<string, number>> {
    const passwords = ciphers.map((c) => c.login?.password).filter((p) => !Utils.isNullOrEmpty(p));
    const uniquePasswords = [...new Set(passwords)];

    const leakedPasswords = await Promise.all(
      uniquePasswords.map(async (password) => {
        return { id: password, nbr: await this.auditService.passwordLeaked(password) };
      }),
    );
    const leakedPasswordsMap = new Map(leakedPasswords.map((lp) => [lp.id, lp.nbr]));

    return new Map(ciphers.map((c) => [c.id, leakedPasswordsMap.get(c.login?.password)]));
  }
}
