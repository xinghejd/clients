export abstract class NativeWebauthnMainAbstraction {
  init: () => void;
  webauthnCreate: () => Promise<string>;
}
