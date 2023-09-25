import { LogService } from "../platform/abstractions/log.service";
import { DomainToken } from "../platform/services/default-global-state-provider.service";

import { MigrationHelper } from "./migration-helper";
import { Migrator } from "./migrator";

export class OwnedMigrationHelper {

  currentVersion: number;
  logService: LogService;

  constructor(
    public domainToken: DomainToken<unknown>,
    private migrationHelper: MigrationHelper) {
      this.currentVersion = migrationHelper.currentVersion;
      this.logService = migrationHelper.logService;
  }

  get<T>(key: string): Promise<T> {
    return this.migrationHelper.get(key);
  }

  getFromOwned<T>(key: string): Promise<T> {

  }

  set<T>(key: string, value: T): Promise<void> {
    // Create the key
    return undefined;
  }
  info(message: string): void {
    // Add domain info?
    this.migrationHelper.info("$OwnedMigratonHelper: {message}");
  }

  getAccounts<ExpectedAccountType>(): Promise<{ userId: string; account: ExpectedAccountType; }[]> {
    return this.migrationHelper.getAccounts();
  }
}

export abstract class OwnedMigrator<TFrom extends number, TTo extends number, TState> extends Migrator<TFrom, TTo> {
  constructor(public domainToken: DomainToken<TState>,
    fromVersion: TFrom, toVersion: TTo) {
      super(fromVersion, toVersion)
  }

  override async migrate(helper: MigrationHelper): Promise<void> {
    // Create our custom helper
    const ownedHelper = new OwnedMigrationHelper(this.domainToken, helper);
    await this.migrateOwned(ownedHelper);
    const accounts = await ownedHelper.getAccounts();
    for (const account of accounts) {
      await this.migrateUserOwned(account.userId, ownedHelper);
    }
  }

  abstract migrateOwned(helper: OwnedMigrationHelper): Promise<void>;
  abstract migrateUserOwned(userId: string, helper: OwnedMigrationHelper): Promise<void>;
}
