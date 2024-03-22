import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { Utils } from "@bitwarden/common/platform/misc/utils";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";

type CipherHealth = {
  item: CipherView;
  health: {
    passwordLeaked: number;
    passwordReuse: number;
    passwordWeak: boolean;
  };
};

export class HealthDashboardService {
  constructor(
    private cipherService: CipherService,
    private auditService: AuditService,
    private passwordStrengthService: PasswordStrengthServiceAbstraction,
  ) {}

  async getHealth(): Promise<CipherHealth[]> {
    const ciphers = await this.cipherService.getAllDecrypted();
    const loginCiphers = ciphers.filter((c) => c.type === CipherType.Login && !c.isDeleted);

    const passwordReuseMap = await this.countPasswordReuse(loginCiphers);
    const passwordLeakedMap = await this.countPasswordLeaked(loginCiphers);
    const weakPasswordMap = this.passwordWeak(loginCiphers);

    const metadata = loginCiphers.map((c) => ({
      item: c,
      health: {
        passwordLeaked: passwordLeakedMap.get(c.id) ?? 0,
        passwordReuse: passwordReuseMap.get(c.id) ?? 0,
        passwordWeak: weakPasswordMap.get(c.id) ? true : false,
      },
    }));

    return metadata.filter(
      (m) =>
        m.health.passwordReuse > 1 || m.health.passwordLeaked > 0 || m.health.passwordWeak === true,
    );
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

  private passwordWeak(ciphers: any[]) {
    const passwordStrengthCache = new Map<string, number>();

    const scores = ciphers.flatMap((c) => {
      const hasUserName = Utils.isNullOrWhitespace(c.login.username);
      const cacheKey = c.login.password + "_____" + (hasUserName ? c.login.username : "");

      if (!passwordStrengthCache.has(cacheKey)) {
        const result = this.passwordStrength(c);
        passwordStrengthCache.set(cacheKey, result.score);
      }

      return {
        id: c.id,
        score: passwordStrengthCache.get(cacheKey),
      };
    });

    return new Map(scores.filter((s) => s.score <= 2).map((s) => [s.id, s.score]));
  }

  private passwordStrength(cipher: CipherView) {
    let userInput: string[] = [];
    if (!Utils.isNullOrWhitespace(cipher.login.username)) {
      const atPosition = cipher.login.username.indexOf("@");
      if (atPosition > -1) {
        userInput = userInput
          .concat(
            cipher.login.username
              .substr(0, atPosition)
              .trim()
              .toLowerCase()
              .split(/[^A-Za-z0-9]/),
          )
          .filter((i) => i.length >= 3);
      } else {
        userInput = cipher.login.username
          .trim()
          .toLowerCase()
          .split(/[^A-Za-z0-9]/)
          .filter((i: any) => i.length >= 3);
      }
    }
    const result = this.passwordStrengthService.getPasswordStrength(
      cipher.login.password,
      null,
      userInput.length > 0 ? userInput : null,
    );

    return result;
  }
}
