import { KeyDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

/** settings targeted by migrator */
export type AccountType = {
  settings?: {
    usernameGenerationOptions?: ExpectedOptions;
  };
};

/** username generation options prior to refactoring */
export type ExpectedOptions = {
  type?: "word" | "subaddress" | "catchall" | "forwarded";
  wordCapitalize?: boolean;
  wordIncludeNumber?: boolean;
  subaddressType?: "random" | "website-name";
  subaddressEmail?: string;
  catchallType?: "random" | "website-name";
  catchallDomain?: string;
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

/** username generation options after refactoring */
type ConvertedOptions = {
  generator: GeneratorNavigation;
  algorithms: {
    catchall: CatchallGenerationOptions;
    effUsername: EffUsernameGenerationOptions;
    subaddress: SubaddressGenerationOptions;
  };
  forwarders: {
    addyIo: SelfHostedApiOptions & EmailDomainOptions;
    duckDuckGo: ApiOptions;
    fastmail: ApiOptions;
    firefoxRelay: ApiOptions;
    forwardEmail: ApiOptions & EmailDomainOptions;
    simpleLogin: SelfHostedApiOptions;
  };
};

const NAVIGATION: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "generatorSettings",
};

const CATCHALL: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "catchallGeneratorSettings",
};

const EFF_USERNAME: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "effUsernameGeneratorSettings",
};

const SUBADDRESS: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "subaddressGeneratorSettings",
};

const ADDY_IO: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "addyIoRollover",
};

const DUCK_DUCK_GO: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "duckDuckGoRollover",
};

const FASTMAIL: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "fastmailRollover",
};

const FIREFOX_RELAY: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "firefoxRelayRollover",
};

const FORWARD_EMAIL: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "forwardEmailRollover",
};

const SIMPLE_LOGIN: KeyDefinitionLike = {
  stateDefinition: {
    name: "generator",
  },
  key: "simpleLoginRollover",
};

export type GeneratorNavigation = {
  type?: string;
  username?: string;
  forwarder?: string;
};

type UsernameGenerationMode = "random" | "website-name";

type CatchallGenerationOptions = {
  catchallType?: UsernameGenerationMode;
  catchallDomain?: string;
};

type EffUsernameGenerationOptions = {
  wordCapitalize?: boolean;
  wordIncludeNumber?: boolean;
};

type SubaddressGenerationOptions = {
  subaddressType?: UsernameGenerationMode;
  subaddressEmail?: string;
};

type ApiOptions = {
  token?: string;
};

type SelfHostedApiOptions = ApiOptions & {
  baseUrl: string;
};

type EmailDomainOptions = {
  domain: string;
};

export class ForwarderOptionsMigrator extends Migrator<54, 55> {
  async migrate(helper: MigrationHelper): Promise<void> {
    type Pair = { userId: string; account: AccountType };
    const accounts = await helper.getAccounts<AccountType>();

    // without the bind, `this` within `migrateAccount` refers to `accounts`
    const migrateAccount = Function.bind(this, async ({ userId, account }: Pair) => {
      const legacyOptions = account?.settings?.usernameGenerationOptions;

      if (legacyOptions) {
        const converted = this.convertSettings(legacyOptions);
        await this.storeSettings(helper, userId, converted);
        await this.deleteSettings(helper, userId, account);
      }
    });

    await Promise.all(accounts.map(migrateAccount));
  }

  private convertSettings(options: ExpectedOptions): ConvertedOptions {
    const forwarders = {
      addyIo: {
        baseUrl: options.forwardedAnonAddyBaseUrl,
        token: options.forwardedAnonAddyApiToken,
        domain: options.forwardedAnonAddyDomain,
      },
      duckDuckGo: {
        token: options.forwardedDuckDuckGoToken,
      },
      fastmail: {
        token: options.forwardedFastmailApiToken,
      },
      firefoxRelay: {
        token: options.forwardedFirefoxApiToken,
      },
      forwardEmail: {
        token: options.forwardedForwardEmailApiToken,
        domain: options.forwardedForwardEmailDomain,
      },
      simpleLogin: {
        token: options.forwardedSimpleLoginApiKey,
        baseUrl: options.forwardedSimpleLoginBaseUrl,
      },
    };

    const generator = {
      username: options.type,
      forwarder: options.forwardedService,
    };

    const algorithms = {
      effUsername: {
        wordCapitalize: options.wordCapitalize,
        wordIncludeNumber: options.wordIncludeNumber,
      },
      subaddress: {
        subaddressType: options.subaddressType,
        subaddressEmail: options.subaddressEmail,
      },
      catchall: {
        catchallType: options.catchallType,
        catchallDomain: options.catchallDomain,
      },
    };

    return { generator, algorithms, forwarders };
  }

  private async storeSettings(
    helper: MigrationHelper,
    userId: string,
    converted: ConvertedOptions,
  ) {
    await Promise.all([
      helper.setToUser(userId, NAVIGATION, converted.generator),
      helper.setToUser(userId, CATCHALL, converted.algorithms.catchall),
      helper.setToUser(userId, EFF_USERNAME, converted.algorithms.effUsername),
      helper.setToUser(userId, SUBADDRESS, converted.algorithms.subaddress),
      helper.setToUser(userId, ADDY_IO, converted.forwarders.addyIo),
      helper.setToUser(userId, DUCK_DUCK_GO, converted.forwarders.duckDuckGo),
      helper.setToUser(userId, FASTMAIL, converted.forwarders.fastmail),
      helper.setToUser(userId, FIREFOX_RELAY, converted.forwarders.firefoxRelay),
      helper.setToUser(userId, FORWARD_EMAIL, converted.forwarders.forwardEmail),
      helper.setToUser(userId, SIMPLE_LOGIN, converted.forwarders.simpleLogin),
    ]);
  }

  private async deleteSettings(helper: MigrationHelper, userId: string, account: AccountType) {
    delete account?.settings?.usernameGenerationOptions;
    await helper.set(userId, account);
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    // not supported
  }
}
