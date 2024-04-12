import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import {
  EncryptedHistory,
  GeneratorHistoryMigrator,
  HISTORY,
} from "./58-migrate-generator-history";

function migrationHelper(encrypted: EncryptedHistory) {
  const helper = mockMigrationHelper(
    {
      authenticatedAccounts: ["SomeAccount"],
      SomeAccount: {
        data: {
          passwordGenerationHistory: {
            encrypted,
          },
          this: {
            looks: "important",
          },
        },
        cant: {
          touch: "this",
        },
      },
    },
    57,
  );

  return helper;
}

function expectOtherSettingsRemain(helper: MigrationHelper) {
  expect(helper.set).toHaveBeenCalledWith("SomeAccount", {
    data: {
      this: {
        looks: "important",
      },
    },
    cant: {
      touch: "this",
    },
  });
}

describe("PasswordOptionsMigrator", () => {
  describe("migrate", () => {
    it("migrates generator type", async () => {
      const helper = migrationHelper([{ this: "should be copied" }, { this: "too" }]);
      const migrator = new GeneratorHistoryMigrator(57, 58);

      await migrator.migrate(helper);

      expect(helper.setToUser).toHaveBeenCalledWith("SomeAccount", HISTORY, [
        { this: "should be copied" },
        { this: "too" },
      ]);
      expectOtherSettingsRemain(helper);
    });
  });
});
