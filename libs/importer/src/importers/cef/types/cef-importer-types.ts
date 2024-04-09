export interface CredentialExchangeFormat extends CredentialExchangeFormatHeader {}

export interface CredentialExchangeFormatHeader {
  version: number;
  exporter: string;
  timestamp: number;
  accounts: AccountsEntity[];
}

export interface AccountsEntity {
  id: string;
  userName: string;
  email: string;
  fullName?: string;
  icon?: string;
  collections: CEFCollection[];
  items: Item[];
  // extensions: Extensions
}

export interface CEFCollection {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  items: Item[];
  subCollections?: CEFCollection[];
  // sequence<Extension> extensions;
}

export interface Item {
  id: string;
  creationAt: number;
  modifiedAt: number;
  type: "login" | "document" | "identity";
  title: string;
  subtitle?: string;
  credentials: (BasicAuthCredential | PasskeyCredential | CreditCardCredential)[];
  tags?: string[];
  // sequence<Extension> extensions;
}

const CredentialType = {
  BasicAuth: "basic-auth",
  Passkey: "passkey",
  TOTP: "totp",
  CryptographicKey: "cryptographic-key",
  Note: "note",
  CreditCard: "credit-card",
} as const;
export type CredentialType = (typeof CredentialType)[keyof typeof CredentialType];

export interface Credential {
  type: CredentialType;
}

export interface EditableField {
  id: string;
  fieldType: string;
  value: string;
  label?: string;
  designation?: string;
}

export interface BasicAuthCredential extends Credential {
  type: "basic-auth";
  urls: string[];
  username?: EditableField;
  password?: EditableField;
}

// FIDO
interface Fido2HmacSecret {
  algorithm: string;
  secret: string;
}

interface Fido2LargeBlob {
  size: number;
  alg: string;
  data: string;
}

interface Fido2SupplementalKeys {
  device: boolean;
  provider: boolean;
}

interface Fido2Extensions {
  hmacSecret: Fido2HmacSecret;
  credBlob: string;
  largeBlob: Fido2LargeBlob;
  payments: boolean;
  supplementalKeys: Fido2SupplementalKeys;
}

export interface PasskeyCredential extends Credential {
  type: "passkey";
  credentialId: string;
  rpId: string;
  userName: string;
  userDisplayName: string;
  userHandle: string;
  // JWK, CoseKey, pkcs#8 ?
  key: {
    pkcs8: string;
  };
  fido2Extensions?: Fido2Extensions;
}

export interface CreditCardCredential extends Credential {
  type: "credit-card";
  number: string;
  fullName: string;
  cardType?: string;
  verificationNumber?: string;
  expiryDate?: string;
  validFrom?: string;
}
