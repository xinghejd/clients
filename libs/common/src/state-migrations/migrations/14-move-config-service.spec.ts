import { runMigrator } from "../migration-helper.spec";

import { MoveConfigService } from "./14-move-config-service";

describe("MoveConfigService", () => {
  const sut = new MoveConfigService(13, 14);

  it("should migrate truthy value", async () => {
    const output = await runMigrator(sut, {
      authenticatedAccounts: ["user1"] as const,
      user1: {
        settings: {
          foo: "Bar",
          serverConfig: {
            featureStates: {
              "trusted-device-encryption": true,
              "fido2-vault-credentials": true,
            },
            version: "2024.1.2",
            gitHash: "880ceafe",
            server: {},
            utcDate: "2024-01-25T16:33:33.898Z",
            environment: {
              cloudRegion: null,
              vault: "https://localhost:8080",
              api: "http://localhost:4000",
              identity: "http://127.0.0.1:33656",
              notifications: "http://localhost:61840",
              sso: "http://127.0.0.1:51822",
            },
          },
        },
      },
    });

    expect(output).toEqual({
      authenticatedAccounts: ["user1"],
      user1: {
        settings: {
          foo: "Bar",
        },
      },
      user_user1_config_server: {
        featureStates: {
          "trusted-device-encryption": true,
          "fido2-vault-credentials": true,
        },
        version: "2024.1.2",
        gitHash: "880ceafe",
        server: {},
        utcDate: "2024-01-25T16:33:33.898Z",
        environment: {
          cloudRegion: null,
          vault: "https://localhost:8080",
          api: "http://localhost:4000",
          identity: "http://127.0.0.1:33656",
          notifications: "http://localhost:61840",
          sso: "http://127.0.0.1:51822",
        },
      },
    });
  });

  it("does not migrate falsey value", async () => {
    const output = await runMigrator(sut, {
      authenticatedAccounts: ["user1"] as const,
      global: { foo: "Bar" },
      user1: {
        settings: {
          foo: "Bar",
        },
      },
    });

    expect(output).toEqual({
      authenticatedAccounts: ["user1"],
      global: { foo: "Bar" },
      user1: {
        settings: {
          foo: "Bar",
        },
      },
    });
  });

  it("migrates multiple users", async () => {
    const output = await runMigrator(sut, {
      authenticatedAccounts: ["user1", "user2"] as const,
      user1: {
        settings: {
          serverConfig: {
            featureStates: {
              "trusted-device-encryption": true,
              "fido2-vault-credentials": true,
            },
            version: "2024.1.2",
            gitHash: "880ceafe",
            server: {},
            utcDate: "2024-01-25T16:33:33.898Z",
            environment: {
              cloudRegion: null,
              vault: "https://localhost:8080",
              api: "http://localhost:4000",
              identity: "http://127.0.0.1:33656",
              notifications: "http://localhost:61840",
              sso: "http://127.0.0.1:51822",
            },
          },
        },
      },
      user2: {
        settings: {
          serverConfig: {
            featureStates: {
              "trusted-device-encryption": false,
              "fido2-vault-credentials": false,
              "random-feature": true,
            },
            version: "2023.1.0",
            gitHash: "31dd6b8",
            server: {},
            utcDate: "2023-01-10T10:23:47.145Z",
            environment: {
              cloudRegion: null,
              vault: "https://localhost:8080",
              api: "http://localhost:4000",
              identity: "http://localhost:33656",
              notifications: "http://localhost:61840",
              sso: "http://localhost:51822",
            },
          },
        },
      },
    });

    expect(output).toEqual({
      authenticatedAccounts: ["user1", "user2"],
      user1: { settings: {} },
      user2: { settings: {} },
      user_user1_config_server: {
        featureStates: {
          "trusted-device-encryption": true,
          "fido2-vault-credentials": true,
        },
        version: "2024.1.2",
        gitHash: "880ceafe",
        server: {},
        utcDate: "2024-01-25T16:33:33.898Z",
        environment: {
          cloudRegion: null,
          vault: "https://localhost:8080",
          api: "http://localhost:4000",
          identity: "http://127.0.0.1:33656",
          notifications: "http://localhost:61840",
          sso: "http://127.0.0.1:51822",
        },
      },
      user_user2_config_server: {
        featureStates: {
          "trusted-device-encryption": false,
          "fido2-vault-credentials": false,
          "random-feature": true,
        },
        version: "2023.1.0",
        gitHash: "31dd6b8",
        server: {},
        utcDate: "2023-01-10T10:23:47.145Z",
        environment: {
          cloudRegion: null,
          vault: "https://localhost:8080",
          api: "http://localhost:4000",
          identity: "http://localhost:33656",
          notifications: "http://localhost:61840",
          sso: "http://localhost:51822",
        },
      },
    });
  });

  it("rollsback data", async () => {
    const output = await runMigrator(
      sut,
      {
        authenticatedAccounts: ["user1", "user2", "user3"] as const,
        user1: null,
        user2: { settings: null },
        user3: { settings: { foo: "bar" } },
        user_user1_config_server: {},
        user_user2_config_server: {
          featureStates: {
            "trusted-device-encryption": false,
            "fido2-vault-credentials": false,
            "random-feature": true,
          },
          version: "2023.1.0",
          gitHash: "31dd6b8",
          server: {},
          utcDate: "2023-01-10T10:23:47.145Z",
          environment: {
            cloudRegion: null,
            vault: "https://localhost:8080",
            api: "http://localhost:4000",
            identity: "http://localhost:33656",
            notifications: "http://localhost:61840",
            sso: "http://localhost:51822",
          },
        },
        user_user3_config_server: null,
      },
      "rollback",
    );

    expect(output).toEqual({
      authenticatedAccounts: ["user1", "user2", "user3"],
      user1: {
        settings: {
          serverConfig: {},
        },
      },
      user2: {
        settings: {
          serverConfig: {
            featureStates: {
              "trusted-device-encryption": false,
              "fido2-vault-credentials": false,
              "random-feature": true,
            },
            version: "2023.1.0",
            gitHash: "31dd6b8",
            server: {},
            utcDate: "2023-01-10T10:23:47.145Z",
            environment: {
              cloudRegion: null,
              vault: "https://localhost:8080",
              api: "http://localhost:4000",
              identity: "http://localhost:33656",
              notifications: "http://localhost:61840",
              sso: "http://localhost:51822",
            },
          },
        },
      },
      user3: { settings: { foo: "bar" } },
      user_user1_config_server: null,
      user_user2_config_server: null,
      user_user3_config_server: null,
    });
  });
});
