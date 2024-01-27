import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = {
  settings?: {
    biometricUnlock?: boolean;
    dismissedBiometricRequirePasswordOnStartCallout?: boolean;
  };
  keys?: { biometricEncryptionClientKeyHalf?: string };
};

// Biometric text and no auto prompt text is refreshed on every app start, so we don't need to migrate it

export const BIOMETRIC_UNLOCK_ENABLED: KeyDefinitionLike = {
  key: "biometricUnlockEnabled",
  stateDefinition: { name: "desktopBiometricSettings" },
};
export const DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT: KeyDefinitionLike = {
  key: "dismissedBiometricRequirePasswordOnStartCallout",
  stateDefinition: { name: "desktopBiometricSettings" },
};
export const ENCRYPTED_CLIENT_KEY_HALF: KeyDefinitionLike = {
  key: "clientKeyHalf",
  stateDefinition: { name: "desktopBiometricSettings" },
};

export class MoveDesktopBiometricStateToProviders extends Migrator<12, 13> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const legacyAccounts = await helper.getAccounts<ExpectedAccountType>();

    await Promise.all(
      legacyAccounts.map(async ({ userId, account }) => {
        if (account == null) {
          return;
        }
        // Move account data
        if (account?.settings?.biometricUnlock != null) {
          await helper.setToUser(
            userId,
            BIOMETRIC_UNLOCK_ENABLED,
            account.settings.biometricUnlock,
          );
        }

        if (account?.settings?.dismissedBiometricRequirePasswordOnStartCallout != null) {
          await helper.setToUser(
            userId,
            DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
            account.settings.dismissedBiometricRequirePasswordOnStartCallout,
          );
        }

        if (account?.keys?.biometricEncryptionClientKeyHalf != null) {
          await helper.setToUser(
            userId,
            ENCRYPTED_CLIENT_KEY_HALF,
            account.keys.biometricEncryptionClientKeyHalf,
          );
        }

        // Delete old account data
        delete account?.settings?.biometricUnlock;
        delete account?.settings?.dismissedBiometricRequirePasswordOnStartCallout;
        delete account?.keys?.biometricEncryptionClientKeyHalf;
        await helper.set(userId, account);
      }),
    );
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    async function rollbackUser(userId: string, account: ExpectedAccountType) {
      let updatedAccount = false;
      const userEnabled = await helper.getFromUser<boolean>(userId, BIOMETRIC_UNLOCK_ENABLED);

      if (userEnabled) {
        account ??= {};
        account.settings ??= {};

        updatedAccount = true;
        account.settings.biometricUnlock = userEnabled;
        await helper.setToUser(userId, BIOMETRIC_UNLOCK_ENABLED, null);
      }

      const userDismissed = await helper.getFromUser<boolean>(
        userId,
        DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT,
      );

      if (userDismissed) {
        account ??= {};
        account.settings ??= {};

        updatedAccount = true;
        account.settings.dismissedBiometricRequirePasswordOnStartCallout = userDismissed;
        await helper.setToUser(userId, DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT, null);
      }

      const userKeyHalf = await helper.getFromUser<string>(userId, ENCRYPTED_CLIENT_KEY_HALF);

      if (userKeyHalf) {
        account ??= {};
        account.keys ??= {};

        updatedAccount = true;
        account.keys.biometricEncryptionClientKeyHalf = userKeyHalf;
        await helper.setToUser(userId, ENCRYPTED_CLIENT_KEY_HALF, null);
      }

      if (updatedAccount) {
        await helper.set(userId, account);
      }
    }

    const accounts = await helper.getAccounts<ExpectedAccountType>();

    await Promise.all(accounts.map(({ userId, account }) => rollbackUser(userId, account)));
  }
}
