import { MockProxy, mock } from "jest-mock-extended";

import { AuditService } from "@bitwarden/common/abstractions/audit.service";
import { PasswordStrengthServiceAbstraction } from "@bitwarden/common/tools/password-strength";
import { CipherService } from "@bitwarden/common/vault/abstractions/cipher.service";
import { CipherType } from "@bitwarden/common/vault/enums";
import { CipherView } from "@bitwarden/common/vault/models/view/cipher.view";
import { LoginView } from "@bitwarden/common/vault/models/view/login.view";

import { HealthDashboardService } from "./health-dashboard.service";

describe("HealthDashboardService", () => {
  let service: HealthDashboardService;
  let cipherService: MockProxy<CipherService>;
  let auditService: MockProxy<AuditService>;
  let passwordStrengthService: MockProxy<PasswordStrengthServiceAbstraction>;

  beforeEach(() => {
    cipherService = mock();
    auditService = mock();
    passwordStrengthService = mock();
    service = new HealthDashboardService(cipherService, auditService, passwordStrengthService);
  });

  describe("getHealth", () => {
    it("should return an empty array", async () => {
      cipherService.getAllDecrypted.mockResolvedValue([]);
      const result = await service.getHealth();
      expect(result).toEqual([]);
    });

    it("should find password reuse", async () => {
      const ciphers: CipherView[] = [
        createCipherView("1", "abc123"),
        createCipherView("2", "abc123"),
      ];
      cipherService.getAllDecrypted.mockResolvedValue(ciphers);
      passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 3 } as any);

      const result = await service.getHealth();
      expect(result).toEqual([
        { item: ciphers[0], health: { passwordLeaked: 0, passwordReuse: 2, passwordWeak: false } },
        { item: ciphers[1], health: { passwordLeaked: 0, passwordReuse: 2, passwordWeak: false } },
      ]);
    });

    it("should find leaked passwords", async () => {
      const ciphers: CipherView[] = [
        createCipherView("1", "qwerty"),
        createCipherView("2", "abc123"),
      ];
      cipherService.getAllDecrypted.mockResolvedValue(ciphers);
      auditService.passwordLeaked.mockImplementation((p) =>
        Promise.resolve(p === "qwerty" ? 1234 : 0),
      );
      passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 3 } as any);

      const result = await service.getHealth();
      expect(result).toEqual([
        {
          item: ciphers[0],
          health: { passwordLeaked: 1234, passwordReuse: 0, passwordWeak: false },
        },
      ]);
    });

    it("should find weak passwords", async () => {
      const ciphers: CipherView[] = [
        createCipherView("1", "qwerty"),
        createCipherView("2", "abc123"),
      ];
      cipherService.getAllDecrypted.mockResolvedValue(ciphers);
      passwordStrengthService.getPasswordStrength.mockReturnValueOnce({ score: 1 } as any);
      passwordStrengthService.getPasswordStrength.mockReturnValue({ score: 3 } as any);

      const result = await service.getHealth();
      expect(result).toEqual([
        {
          item: ciphers[0],
          health: { passwordLeaked: 0, passwordReuse: 0, passwordWeak: true },
        },
      ]);
    });
  });
});

function createCipherView(id: string, password: string): CipherView {
  const cipher = new CipherView();
  cipher.id = id;
  cipher.type = CipherType.Login;
  cipher.login = new LoginView();
  cipher.login.password = password;
  cipher.edit = true;
  cipher.viewPassword = true;
  return cipher;
}
