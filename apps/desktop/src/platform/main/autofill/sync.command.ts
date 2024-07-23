import { CommandDefinition, CommandOutput } from "./command";

export interface NativeAutofillSyncCommand extends CommandDefinition {
  name: "sync";
  input: NativeAutofillSyncParams;
  output: NativeAutofillSyncResult;
}

export type NativeAutofillSyncParams = {
  credentials: NativeAutofillCredential[];
};

export type NativeAutofillCredential =
  | NativeAutofillFido2Credential
  | NativeAutofillPasswordCredential;

export type NativeAutofillFido2Credential = {
  type: "fido2";
};

export type NativeAutofillPasswordCredential = {
  type: "password";
};

export type NativeAutofillSyncResult = CommandOutput<{
  added: number;
}>;
