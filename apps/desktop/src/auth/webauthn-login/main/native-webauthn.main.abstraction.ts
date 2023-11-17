export abstract class NativeWebauthnMainAbstraction {
  init: () => void;
  webauthnCreate: () => string;
}
