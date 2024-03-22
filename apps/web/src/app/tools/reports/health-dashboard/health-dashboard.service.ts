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
    const loginCiphers = ciphers.filter((c) => c.type === CipherType.Login);

    const passwordReuseMap = await this.countPasswordReuse(loginCiphers);

    const metadata = loginCiphers.map((c) => ({
      item: c,
      health: {
        passwordLeaked: 0,
        passwordReuse: passwordReuseMap.get(c.id) ?? 0,
      },
    }));

    return metadata.filter((m) => m.health.passwordReuse > 1 || m.health.passwordLeaked > 0);
  }

  private async countPasswordReuse(ciphers: CipherView[]): Promise<Map<string, number>> {
    const passwordUseMap = new Map<string, number>();

    ciphers.forEach((cipher) => {
      const { login, isDeleted, edit, viewPassword } = cipher;
      if (Utils.isNullOrEmpty(login.password) || isDeleted || !edit || !viewPassword) {
        return;
      }

      if (passwordUseMap.has(login.password)) {
        passwordUseMap.set(login.password, passwordUseMap.get(login.password) + 1);
      } else {
        passwordUseMap.set(login.password, 1);
      }
    });

    return new Map(ciphers.map((c) => [c.id, passwordUseMap.get(c.login?.password)]));
  }
}
