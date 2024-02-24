export abstract class LoginService {
  abstract getEmail(): string;
  abstract getRememberEmail(): boolean;
  abstract setEmail(value: string): void;
  abstract setRememberEmail(value: boolean): void;
  abstract clearValues(): void;
  abstract saveEmailSettings(): Promise<void>;
}
