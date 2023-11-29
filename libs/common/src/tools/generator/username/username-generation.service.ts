import { ApiService } from "../../../abstractions/api.service";
import { CryptoService } from "../../../platform/abstractions/crypto.service";
import { EncryptService } from "../../../platform/abstractions/encrypt.service";
import { I18nService } from "../../../platform/abstractions/i18n.service";
import { StateService } from "../../../platform/abstractions/state.service";
import { EFFLongWordList } from "../../../platform/misc/wordlist";

import { createForwarder } from "./email-forwarders";
import {
  UsernameGeneratorOptions,
  DefaultOptions,
  getForwarderOptions,
  encryptInPlace,
  decryptInPlace,
} from "./username-generation-options";
import { UsernameGenerationServiceAbstraction } from "./username-generation.service.abstraction";

export class UsernameGenerationService implements UsernameGenerationServiceAbstraction {
  constructor(
    private cryptoService: CryptoService,
    private stateService: StateService,
    private apiService: ApiService,
    private i18nService: I18nService,
    private encryptService: EncryptService
  ) {}

  generateUsername(options: UsernameGeneratorOptions): Promise<string> {
    if (options.type === "catchall") {
      return this.generateCatchall(options);
    } else if (options.type === "subaddress") {
      return this.generateSubaddress(options);
    } else if (options.type === "forwarded") {
      return this.generateForwarded(options);
    } else {
      return this.generateWord(options);
    }
  }

  async generateWord(options: UsernameGeneratorOptions): Promise<string> {
    const {
      word: {
        capitalize = DefaultOptions.word.capitalize,
        includeNumber = DefaultOptions.word.includeNumber,
      },
    } = options;

    const wordIndex = await this.cryptoService.randomNumber(0, EFFLongWordList.length - 1);
    let word = EFFLongWordList[wordIndex];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    if (includeNumber) {
      const num = await this.cryptoService.randomNumber(1, 9999);
      word = word + this.zeroPad(num.toString(), 4);
    }
    return word;
  }

  async generateSubaddress(options: UsernameGeneratorOptions): Promise<string> {
    const {
      website,
      subaddress: {
        algorithm = DefaultOptions.subaddress.algorithm,
        email = DefaultOptions.subaddress.email,
      },
    } = options;

    if (email.length < 3) {
      return email;
    }
    const atIndex = email.indexOf("@");
    if (atIndex < 1 || atIndex >= email.length - 1) {
      return email;
    }

    const emailBeginning = email.substring(0, atIndex);
    const emailEnding = email.substring(atIndex + 1, email.length);

    let subaddressString = "";
    if (algorithm === "random") {
      subaddressString = await this.randomString(8);
    } else if (algorithm === "website-name") {
      subaddressString = website;
    }
    return emailBeginning + "+" + subaddressString + "@" + emailEnding;
  }

  async generateCatchall(options: UsernameGeneratorOptions): Promise<string> {
    const {
      website,
      catchall: {
        algorithm = DefaultOptions.catchall.algorithm,
        domain = DefaultOptions.catchall.domain,
      },
    } = options;

    if (domain === "") {
      return null;
    }

    let startString = "";
    if (algorithm === "random") {
      startString = await this.randomString(8);
    } else if (algorithm === "website-name") {
      startString = website;
    }
    return startString + "@" + domain;
  }

  async generateForwarded(options: UsernameGeneratorOptions): Promise<string> {
    const {
      website,
      forwarders: { service = DefaultOptions.forwarders.service },
    } = options;

    const forwarder = createForwarder(service, this.apiService, this.i18nService);
    const forwarderOptions = getForwarderOptions(service, options);

    if (!forwarder || !forwarderOptions) {
      const error = this.i18nService.t("forwarder.unknownForwarder", service);
      throw error;
    }

    const generated = await forwarder.generate(website, forwarderOptions);
    return generated;
  }

  async getOptions(): Promise<UsernameGeneratorOptions> {
    let options = await this.stateService.getUsernameGenerationOptions();
    this.decryptKeys(options);

    // clone the assignment result because the default options are frozen and
    // assign aliases the frozen objects in `options`.
    options = structuredClone(Object.assign(options ?? {}, DefaultOptions));

    await this.stateService.setUsernameGenerationOptions(options);
    return options;
  }

  async saveOptions(options: UsernameGeneratorOptions) {
    await this.encryptKeys(options);
    await this.stateService.setUsernameGenerationOptions(options);
  }

  async encryptKeys(options: UsernameGeneratorOptions) {
    const key = await this.cryptoService.getUserKey();

    // each `encryptAndStore` call must be passed an independent object, otherwise
    // they'll race and clobber each other
    await Promise.all([
      encryptInPlace(this.encryptService, key, options.forwarders.addyIo),
      encryptInPlace(this.encryptService, key, options.forwarders.duckDuckGo),
      encryptInPlace(this.encryptService, key, options.forwarders.fastMail),
      encryptInPlace(this.encryptService, key, options.forwarders.firefoxRelay),
      encryptInPlace(this.encryptService, key, options.forwarders.forwardEmail),
      encryptInPlace(this.encryptService, key, options.forwarders.simpleLogin),
    ]);
  }

  async decryptKeys(options: UsernameGeneratorOptions) {
    const key = await this.cryptoService.getUserKey();

    // each `decryptAndStore` call must be passed an independent object, otherwise
    // they'll race and clobber each other
    await Promise.all([
      decryptInPlace(this.encryptService, key, options.forwarders.addyIo),
      decryptInPlace(this.encryptService, key, options.forwarders.duckDuckGo),
      decryptInPlace(this.encryptService, key, options.forwarders.fastMail),
      decryptInPlace(this.encryptService, key, options.forwarders.firefoxRelay),
      decryptInPlace(this.encryptService, key, options.forwarders.forwardEmail),
      decryptInPlace(this.encryptService, key, options.forwarders.simpleLogin),
    ]);
  }

  private async randomString(length: number) {
    let str = "";
    const charSet = "abcdefghijklmnopqrstuvwxyz1234567890";
    for (let i = 0; i < length; i++) {
      const randomCharIndex = await this.cryptoService.randomNumber(0, charSet.length - 1);
      str += charSet.charAt(randomCharIndex);
    }
    return str;
  }

  // ref: https://stackoverflow.com/a/10073788
  private zeroPad(number: string, width: number) {
    return number.length >= width
      ? number
      : new Array(width - number.length + 1).join("0") + number;
  }
}
