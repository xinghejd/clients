// TODO: Add message
// eslint-disable-next-line import/no-restricted-paths
import { userKeyBuilder } from "../../platform/misc/key-builders";
// TODO: Add message
// eslint-disable-next-line import/no-restricted-paths
import { KeyDefinition } from "../../platform/types/key-definition";
// TODO: Add message
// eslint-disable-next-line import/no-restricted-paths
import { StateDefinition } from "../../platform/types/state-definition";
import { MigrationHelper } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

type ExpectedAccountType = {
  data: {
    folders: {
      encrypted: Record<string, { name: string; id: string; revisionDate: string }>;
    };
  };
};

const FOLDER_STATE = new StateDefinition("FolderService", "disk");

const INITIAL_FOLDER_USER_KEY = new KeyDefinition<unknown>(FOLDER_STATE, "folders", (s) => s);

export class MoveFolderToOwnedMigrator extends Migrator<8, 9> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<ExpectedAccountType>();
    async function updateAccount(userId: string, account: ExpectedAccountType) {
      if (account == null) {
        return;
      }

      const userKey = userKeyBuilder(userId, INITIAL_FOLDER_USER_KEY);
      await helper.set(userKey, account.data.folders.encrypted);

      // TODO: Is there ever anything more on the folders object than the encrypted prop
      // delete account.data.folders;
      helper.info(`Would delete: ${JSON.stringify(account.data.folders)}`);
      // TODO:
      // await helper.set("", account);
    }

    await Promise.all(accounts.map(({ userId, account }) => updateAccount(userId, account)));
  }

  rollback(helper: MigrationHelper): Promise<void> {
    // TODO: This doesn't actually need to be irreversible
    throw IRREVERSIBLE;
  }
}
