import { MigrationHelper } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

type LegacyAccountType = {
  settings?: {
    usernameGenerationOptions?: {
      type?: "word" | "subaddress" | "catchall" | "forwarded";
      wordCapitalize?: boolean;
      wordIncludeNumber?: boolean;
      subaddressType?: "random" | "website-name";
      subaddressEmail?: string;
      catchallType?: "random" | "website-name";
      catchallDomain?: string;
      website?: string;
      forwardedService?: string;
      forwardedAnonAddyApiToken?: string;
      forwardedAnonAddyDomain?: string;
      forwardedAnonAddyBaseUrl?: string;
      forwardedDuckDuckGoToken?: string;
      forwardedFirefoxApiToken?: string;
      forwardedFastmailApiToken?: string;
      forwardedForwardEmailApiToken?: string;
      forwardedForwardEmailDomain?: string;
      forwardedSimpleLoginApiKey?: string;
      forwardedSimpleLoginBaseUrl?: string;
    };
  };
};

type NewAccountType = {
  settings: {
    usernameGenerationOptions: {
      type: "word" | "subaddress" | "catchall" | "forwarded";
      word: {
        capitalize: boolean;
        includeNumber: boolean;
      };
      subaddress: {
        algorithm: "random" | "website-name";
        email: string;
      };
      catchall: {
        algorithm: "random" | "website-name";
        domain: string;
      };
      website?: string;
      forwarders: {
        service:
          | "fastmail"
          | "anonaddy"
          | "forwardemail"
          | "simplelogin"
          | "duckduckgo"
          | "firefoxrelay";
        fastMail: {
          domain: string;
          prefix: string;
          token: string;
          wasPlainText?: true;
        };
        addyIo: {
          token: string;
          wasPlainText?: true;
          domain: string;
          baseUrl: string;
        };
        forwardEmail: {
          token: string;
          wasPlainText?: true;
          domain: string;
        };
        simpleLogin: {
          token: string;
          wasPlainText?: true;
          baseUrl: string;
        };
        duckDuckGo: {
          token: string;
          wasPlainText?: true;
        };
        firefoxRelay: {
          token: string;
          wasPlainText?: true;
        };
      };
    };
  };
};

export class FactorUsernameGeneratorSettingsMigrator extends Migrator<9, 10> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<LegacyAccountType>();

    await Promise.all([
      ...accounts.map(({ userId, account }) => {
        const newAccount = mapAccount(account);
        helper.set(userId, newAccount);
      }),
    ]);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    // old settings aren't compatible with the new UI, so we can't rollback
    throw IRREVERSIBLE;
  }
}

// exported for unit testing only
export async function mapAccount(account: LegacyAccountType) {
  const oldOptions = account.settings?.usernameGenerationOptions;
  if (!oldOptions) {
    return;
  }

  // if oldOptions exists, then we know that account.settings exists; replace it
  const mappedOptions = {
    settings: {
      usernameGenerationOptions: {
        type: "word",
        word: {
          capitalize: oldOptions.wordCapitalize,
          includeNumber: oldOptions.wordIncludeNumber,
        },
        subaddress: {
          algorithm: oldOptions.subaddressType,
          email: oldOptions.subaddressEmail,
        },
        catchall: {
          algorithm: oldOptions.catchallType,
          domain: oldOptions.catchallDomain,
        },
        website: oldOptions.website,
        forwarders: {
          service: oldOptions.forwardedService,
          fastMail: {
            domain: "",
            prefix: "",
            token: oldOptions.forwardedFastmailApiToken,
          },
          addyIo: {
            token: oldOptions.forwardedAnonAddyApiToken,
            domain: oldOptions.forwardedAnonAddyDomain,
            baseUrl: oldOptions.forwardedAnonAddyBaseUrl,
          },
          forwardEmail: {
            token: oldOptions.forwardedForwardEmailApiToken,
            domain: oldOptions.forwardedForwardEmailDomain,
          },
          simpleLogin: {
            token: oldOptions.forwardedSimpleLoginApiKey,
            baseUrl: oldOptions.forwardedSimpleLoginBaseUrl,
          },
          duckDuckGo: {
            token: oldOptions.forwardedDuckDuckGoToken,
          },
          firefoxRelay: {
            token: oldOptions.forwardedFirefoxApiToken,
          },
        },
      },
    },
  } as NewAccountType;

  // if the token is not empty, then it was stored as plaintext
  if (mappedOptions.settings.usernameGenerationOptions.forwarders.fastMail.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.fastMail.wasPlainText = true;
  }

  if (mappedOptions.settings.usernameGenerationOptions.forwarders.addyIo.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.addyIo.wasPlainText = true;
  }

  if (mappedOptions.settings.usernameGenerationOptions.forwarders.forwardEmail.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.forwardEmail.wasPlainText = true;
  }

  if (mappedOptions.settings.usernameGenerationOptions.forwarders.simpleLogin.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.simpleLogin.wasPlainText = true;
  }

  if (mappedOptions.settings.usernameGenerationOptions.forwarders.duckDuckGo.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.duckDuckGo.wasPlainText = true;
  }

  if (mappedOptions.settings.usernameGenerationOptions.forwarders.firefoxRelay.token.length > 0) {
    mappedOptions.settings.usernameGenerationOptions.forwarders.firefoxRelay.wasPlainText = true;
  }
}
