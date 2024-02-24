export abstract class TotpService {
  abstract getCode(key: string): Promise<string>;
  abstract getTimeInterval(key: string): number;
}
