import { MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

const NAMESPACE_SERVICE = "folders";
const KEY = "folders";

type ExpectedAccountType = {
  data: {
    folders?: {
      encrypted?: Record<string, unknown>;
    };
  };
};

function storageKey(userId: string) {
  return `${userId}_${NAMESPACE_SERVICE}_${KEY}`;
}

export class FlattenFolderState extends Migrator<8, 9> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function updateAccount(userId: string, account: ExpectedAccountType) {
      if (account == null) {
        return;
      }

      const folders = account.data.folders?.encrypted;
      if (folders != null) {
        await helper.set(storageKey(userId), folders);
      }
      delete account.data.folders;
      await helper.set(userId, account);
    }

    await Promise.all(accounts.map(({ userId, account }) => updateAccount(userId, account)));
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    const userIds = await helper.getAuthenticatedAccounts();

    async function rollbackAccount(userId: string) {
      const folders = await helper.get<Record<string, unknown>>(storageKey(userId));
      const account = await helper.get<ExpectedAccountType>(userId);
      if (folders == null) {
        return;
      }

      account.data.folders = {
        encrypted: folders,
      };
      await helper.set(userId, account);
      await helper.remove(storageKey(userId));
    }

    await Promise.all([...userIds.map((userId) => rollbackAccount(userId))]);
  }
}
