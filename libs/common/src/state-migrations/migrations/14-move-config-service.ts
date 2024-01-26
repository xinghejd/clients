import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

type ExpectedAccountType = { settings?: { serverConfig?: unknown } };

const SERVER_CONFIG_KEY: KeyDefinitionLike = {
  key: "serverConfig",
  stateDefinition: { name: "config" },
};

export class MoveConfigService extends Migrator<13, 14> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function migrateAccount(userId: string, account: ExpectedAccountType) {
      if (account?.settings?.serverConfig) {
        await helper.setToUser(userId, SERVER_CONFIG_KEY, account.settings.serverConfig);
        delete account.settings.serverConfig;
        await helper.set(userId, account);
      }
    }

    await Promise.all(accounts.map(({ userId, account }) => migrateAccount(userId, account)));
  }
  async rollback(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();

    async function rollbackAccount(userId: string, account: ExpectedAccountType) {
      const serverConfig = await helper.getFromUser(userId, SERVER_CONFIG_KEY);
      if (serverConfig != null) {
        if (account == null) {
          account = {};
        }

        if (account.settings == null) {
          account.settings = {};
        }

        account.settings.serverConfig = serverConfig;
        await helper.set(userId, account);
        await helper.setToUser(userId, SERVER_CONFIG_KEY, null);
      }
    }

    await Promise.all(accounts.map(({ userId, account }) => rollbackAccount(userId, account)));
  }
}
