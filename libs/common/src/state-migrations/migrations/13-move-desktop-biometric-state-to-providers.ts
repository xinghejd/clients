import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = {
  settings?: {
    disableAutoBiometricsPrompt?: boolean;
    biometricUnlock?: boolean;
    dismissedBiometricRequirePasswordOnStartCallout?: boolean;
  };
  keys?: { biometricEncryptionClientKeyHalf?: string };
};

// Biometric text, no auto prompt text, fingerprint validated, and prompt cancelled are refreshed on every app start, so we don't need to migrate them

export const BIOMETRIC_UNLOCK_ENABLED: KeyDefinitionLike = {
  key: "biometricUnlockEnabled",
  stateDefinition: { name: "biometricSettings" },
};
export const DISMISSED_BIOMETRIC_REQUIRE_PASSWORD_ON_START_CALLOUT: KeyDefinitionLike = {
  key: "dismissedBiometricRequirePasswordOnStartCallout",
  stateDefinition: { name: "biometricSettings" },
};
export const CLIENT_KEY_HALF: KeyDefinitionLike = {
  key: "clientKeyHalf",
  stateDefinition: { name: "biometricSettings" },
};

export const PROMPT_AUTOMATICALLY: KeyDefinitionLike = {
  key: "promptAutomatically",
  stateDefinition: { name: "biometricSettings" },
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
            CLIENT_KEY_HALF,
            account.keys.biometricEncryptionClientKeyHalf,
          );
        }

        if (account?.settings?.disableAutoBiometricsPrompt != null) {
          await helper.setToUser(
            userId,
            PROMPT_AUTOMATICALLY,
            !account.settings.disableAutoBiometricsPrompt,
          );
        }

        // Delete old account data
        delete account?.settings?.biometricUnlock;
        delete account?.settings?.dismissedBiometricRequirePasswordOnStartCallout;
        delete account?.keys?.biometricEncryptionClientKeyHalf;
        delete account?.settings?.disableAutoBiometricsPrompt;
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

      const userKeyHalf = await helper.getFromUser<string>(userId, CLIENT_KEY_HALF);

      if (userKeyHalf) {
        account ??= {};
        account.keys ??= {};

        updatedAccount = true;
        account.keys.biometricEncryptionClientKeyHalf = userKeyHalf;
        await helper.setToUser(userId, CLIENT_KEY_HALF, null);
      }

      const userPromptAutomatically = await helper.getFromUser<boolean>(
        userId,
        PROMPT_AUTOMATICALLY,
      );

      if (userPromptAutomatically != null) {
        account ??= {};
        account.settings ??= {};

        updatedAccount = true;
        account.settings.disableAutoBiometricsPrompt = !userPromptAutomatically;
        await helper.setToUser(userId, PROMPT_AUTOMATICALLY, null);
      }

      if (updatedAccount) {
        await helper.set(userId, account);
      }
    }

    const accounts = await helper.getAccounts<ExpectedAccountType>();

    await Promise.all(accounts.map(({ userId, account }) => rollbackUser(userId, account)));
  }
}
