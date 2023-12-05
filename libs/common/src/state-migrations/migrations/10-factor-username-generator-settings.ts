import { MigrationHelper } from "../migration-helper";
import { IRREVERSIBLE, Migrator } from "../migrator";

/** settings targeted by migrator */
export type AccountType = {
  settings?: {
    usernameGenerationOptions?: LegacyGenerationOptions | NewGenerationOptions;
  };
};

/** username generation options prior to refactoring */
export type LegacyGenerationOptions = {
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

/** valid forwarders as a type. Keep in sync with `ValidForwarderServices` */
type ForwarderService =
  | "fastmail"
  | "anonaddy"
  | "forwardemail"
  | "simplelogin"
  | "duckduckgo"
  | "firefoxrelay";

/** valid forwarders as an array. Keep in sync with `ForwarderService`. */
const ValidForwarderServices = Object.freeze([
  "fastmail",
  "anonaddy",
  "forwardemail",
  "simplelogin",
  "duckduckgo",
  "firefoxrelay",
]);

/** username generation options after refactoring.
 * @remarks Starting at `settings.usernameGenerationOptions`, this is a
 *  reified version of the `UsernameGeneratorOptions` type in
 * `libs/common/src/tools/generator/username/username-generation-options.ts`
 * as of the moment the migration was created.
 */
export type NewGenerationOptions = {
  type: "word" | "subaddress" | "catchall" | "forwarded";
  website?: string;
  saveOnLoad?: true;
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
  forwarders: {
    service: ForwarderService;
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

export class FactorUsernameGeneratorSettingsMigrator extends Migrator<9, 10> {
  async migrate(helper: MigrationHelper): Promise<void> {
    const accounts = await helper.getAccounts<AccountType>();

    await Promise.all([
      ...accounts.map(async ({ userId, account }) => {
        const newAccount = convertAccountInPlace(account);
        if (newAccount) {
          await helper.set(userId, newAccount);
        }
      }),
    ]);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    // old settings aren't compatible with the new UI, so we can't rollback
    throw IRREVERSIBLE;
  }
}

/** Maps legacy generation settings to new generation settings.
 * @remarks Exported for unit testing purposes only.
 */
export function convertAccountInPlace(account?: AccountType) {
  const legacyOptions = account?.settings?.usernameGenerationOptions as LegacyGenerationOptions;
  if (!legacyOptions) {
    return;
  } else if ("forwarders" in legacyOptions) {
    // already converted
    return;
  }

  const newOptions = toNewOptions(legacyOptions);
  configureForwarderService(newOptions, legacyOptions.forwardedService);
  configureForwaderPlainText(newOptions);

  account.settings.usernameGenerationOptions = newOptions;

  return account;
}

/** Maps legacy generation settings to new generation settings.
 */
function toNewOptions(legacy: LegacyGenerationOptions) {
  // default values inlined from
  // `libs/common/src/tools/generator/username/username-generation-options.ts`
  // as of the moment the migration was created.
  const mappedOptions = {
    type: legacy.type ?? "word",
    website: legacy.website,
    // `saveOnLoad` is set to ensure that the settings are encrypted when the user opens the generator.
    saveOnLoad: true,
    word: {
      capitalize: legacy.wordCapitalize ?? false,
      includeNumber: legacy.wordIncludeNumber ?? false,
    },
    subaddress: {
      algorithm: legacy.subaddressType ?? "random",
      email: legacy.subaddressEmail ?? "",
    },
    catchall: {
      algorithm: legacy.catchallType ?? "random",
      domain: legacy.catchallDomain ?? "",
    },
    forwarders: {
      service: "fastmail",
      fastMail: {
        prefix: "",
        token: legacy.forwardedFastmailApiToken ?? "",
      },
      addyIo: {
        token: legacy.forwardedAnonAddyApiToken ?? "",
        domain: legacy.forwardedAnonAddyDomain ?? "",
        baseUrl: legacy.forwardedAnonAddyBaseUrl ?? "https://app.addy.io",
      },
      forwardEmail: {
        token: legacy.forwardedForwardEmailApiToken ?? "",
        domain: legacy.forwardedForwardEmailDomain ?? "",
      },
      simpleLogin: {
        token: legacy.forwardedSimpleLoginApiKey ?? "",
        baseUrl: legacy.forwardedSimpleLoginBaseUrl ?? "https://app.simplelogin.io",
      },
      duckDuckGo: {
        token: legacy.forwardedDuckDuckGoToken ?? "",
      },
      firefoxRelay: {
        token: legacy.forwardedFirefoxApiToken ?? "",
      },
    },
  } as NewGenerationOptions;

  return mappedOptions;
}

/** verifies forwarder service mapping before overwriting the default */
function configureForwarderService(
  options: NewGenerationOptions,
  service: string,
): NewGenerationOptions {
  if (Object.values(ValidForwarderServices).includes(service)) {
    options.forwarders.service = service as ForwarderService;
  }

  return options;
}

/** if the token of any forwarder is set, then the token was stored as plaintext */
function configureForwaderPlainText(options: NewGenerationOptions): NewGenerationOptions {
  const forwarders = [
    options.forwarders.fastMail,
    options.forwarders.addyIo,
    options.forwarders.forwardEmail,
    options.forwarders.simpleLogin,
    options.forwarders.duckDuckGo,
    options.forwarders.firefoxRelay,
  ];
  for (const forwarder of forwarders) {
    if (forwarder.token.length > 0) {
      forwarder.wasPlainText = true;
    }
  }

  return options;
}
