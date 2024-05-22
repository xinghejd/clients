import { Observable } from "rxjs";

import { PasswordGeneratorPolicyOptions } from "../../../admin-console/models/domain/password-generator-policy-options";
import { GeneratedPasswordHistory } from "../password/generated-password-history";
import { PasswordGeneratorOptions } from "../password/password-generator-options";

/** @deprecated Use {@link GeneratorService} with a password or passphrase {@link GeneratorStrategy} instead. */
export abstract class PasswordGenerationServiceAbstraction {
  generatePassword: (options: PasswordGeneratorOptions) => Promise<string>;
  generatePassphrase: (options: PasswordGeneratorOptions) => Promise<string>;
  getOptions: () => Promise<[PasswordGeneratorOptions, PasswordGeneratorPolicyOptions]>;
  getOptions$: () => Observable<[PasswordGeneratorOptions, PasswordGeneratorPolicyOptions]>;
  enforcePasswordGeneratorPoliciesOnOptions: (
    options: PasswordGeneratorOptions,
  ) => Promise<[PasswordGeneratorOptions, PasswordGeneratorPolicyOptions]>;
  saveOptions: (options: PasswordGeneratorOptions) => Promise<void>;
  getHistory: () => Promise<GeneratedPasswordHistory[]>;
  addHistory: (password: string) => Promise<void>;
  clear: (userId?: string) => Promise<GeneratedPasswordHistory[]>;
}

import { Observable } from "rxjs";

import { UsernameGeneratorOptions } from "../username/username-generation-options";

/** @deprecated Use {@link GeneratorService} with a username {@link GeneratorStrategy} instead. */
export abstract class UsernameGenerationServiceAbstraction {
  generateUsername: (options: UsernameGeneratorOptions) => Promise<string>;
  generateWord: (options: UsernameGeneratorOptions) => Promise<string>;
  generateSubaddress: (options: UsernameGeneratorOptions) => Promise<string>;
  generateCatchall: (options: UsernameGeneratorOptions) => Promise<string>;
  generateForwarded: (options: UsernameGeneratorOptions) => Promise<string>;
  getOptions: () => Promise<UsernameGeneratorOptions>;
  getOptions$: () => Observable<UsernameGeneratorOptions>;
  saveOptions: (options: UsernameGeneratorOptions) => Promise<void>;
}
