import { MockProxy } from "jest-mock-extended";

import { MigrationHelper } from "../migration-helper";
import { mockMigrationHelper } from "../migration-helper.spec";

import { FlattenFolderState } from "./9-flatten-folder-state";

function migrateExampleJSON() {
  return {
    global: {
      stateVersion: 8,
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: [
      "c493ed01-4e08-4e88-abc7-332f380ca760",
      "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
      "fd005ea6-a16a-45ef-ba4a-a194269bfd73",
    ],
    "c493ed01-4e08-4e88-abc7-332f380ca760": {
      data: {
        folders: {
          encrypted: {
            "077d866c-3da0-4d2a-b127-253a24836ad5": {
              otherStuff: "otherStuff2",
            },
            "96643bed-22da-42e8-a0c8-f3fb7a2fec41": {
              otherStuff: "otherStuff3",
            },
          },
        },
        otherStuff: "otherStuff4",
      },
      otherStuff: "otherStuff5",
    },
    "23e61a5f-2ece-4f5e-b499-f0bc489482a9": {
      data: {
        folders: {},
        otherStuff: "otherStuff6",
      },
      otherStuff: "otherStuff7",
    },
    otherStuff: "otherStuff8",
  };
}

function rollbackExampleJSON() {
  return {
    global: {
      stateVersion: 8,
      otherStuff: "otherStuff1",
    },
    authenticatedAccounts: [
      "c493ed01-4e08-4e88-abc7-332f380ca760",
      "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
      "fd005ea6-a16a-45ef-ba4a-a194269bfd73",
    ],
    "c493ed01-4e08-4e88-abc7-332f380ca760": {
      data: {
        otherStuff: "otherStuff4",
      },
      otherStuff: "otherStuff5",
    },
    "c493ed01-4e08-4e88-abc7-332f380ca760_folders_folders": {
      "077d866c-3da0-4d2a-b127-253a24836ad5": {
        otherStuff: "otherStuff2",
      },
      "96643bed-22da-42e8-a0c8-f3fb7a2fec41": {
        otherStuff: "otherStuff3",
      },
    },
    "23e61a5f-2ece-4f5e-b499-f0bc489482a9": {
      data: {
        folders: {},
        otherStuff: "otherStuff6",
      },
      otherStuff: "otherStuff7",
    },
    otherStuff: "otherStuff8",
  };
}

describe("FlattenFolderState", () => {
  let helper: MockProxy<MigrationHelper>;
  let sut: FlattenFolderState;

  beforeEach(() => {
    helper = mockMigrationHelper(migrateExampleJSON());
    sut = new FlattenFolderState(8, 9);
  });

  describe("migrate", () => {
    it("should remove folder key from accounts", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith("c493ed01-4e08-4e88-abc7-332f380ca760", {
        data: {
          otherStuff: "otherStuff4",
        },
        otherStuff: "otherStuff5",
      });
      expect(helper.set).toHaveBeenCalledWith("23e61a5f-2ece-4f5e-b499-f0bc489482a9", {
        data: {
          otherStuff: "otherStuff6",
        },
        otherStuff: "otherStuff7",
      });
    });

    it("should set existing folder data at the top level", async () => {
      await sut.migrate(helper);
      expect(helper.set).toHaveBeenCalledWith(
        "c493ed01-4e08-4e88-abc7-332f380ca760_folders_folders",
        {
          "077d866c-3da0-4d2a-b127-253a24836ad5": {
            otherStuff: "otherStuff2",
          },
          "96643bed-22da-42e8-a0c8-f3fb7a2fec41": {
            otherStuff: "otherStuff3",
          },
        }
      );
      expect(helper.set).not.toHaveBeenCalledWith(
        "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
        expect.anything
      );
      expect(helper.set).not.toHaveBeenCalledWith(
        "fd005ea6-a16a-45ef-ba4a-a194269bfd73",
        expect.anything
      );
    });
  });

  describe("rollback", () => {
    const originalJson = migrateExampleJSON();
    beforeEach(async () => {
      helper = mockMigrationHelper(rollbackExampleJSON());
      sut = new FlattenFolderState(8, 9);
      await sut.rollback(helper);
    });

    it("should move folder data back into account", async () => {
      expect(helper.set).toHaveBeenCalledWith(
        "c493ed01-4e08-4e88-abc7-332f380ca760",
        originalJson["c493ed01-4e08-4e88-abc7-332f380ca760"]
      );
      expect(helper.set).not.toHaveBeenCalledWith(
        "23e61a5f-2ece-4f5e-b499-f0bc489482a9",
        expect.anything
      );
      expect(helper.set).not.toHaveBeenCalledWith(
        "fd005ea6-a16a-45ef-ba4a-a194269bfd73",
        expect.anything
      );
    });

    it("should clean up flattened folder data", async () => {
      expect(helper.remove).toHaveBeenCalledWith(
        "c493ed01-4e08-4e88-abc7-332f380ca760_folders_folders"
      );
      expect(helper.remove).toHaveBeenCalledTimes(1);
    });
  });
});
