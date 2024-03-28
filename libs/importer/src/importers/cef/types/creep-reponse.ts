export interface CREEPResponse {
  version: number;
  hpke: HPKEParameters;
  zip: string;
  exporter: string;
  payload: string;
}

export interface HPKEParameters {
  mode: "base" | "psk" | "auth" | "auth-psk";
  kem: number;
  kdf: number;
  aead: number;
  key: string;
}
