import { AuthService } from "../../auth/abstractions/auth.service";

export abstract class SystemService {
  abstract startProcessReload(authService: AuthService): Promise<void>;
  /**
   * Cancels the process reload interval
   * @returns {boolean} - Returns true if the reload interval was cancelled, false otherwise
   */
  abstract cancelProcessReload(): boolean;
  abstract clearClipboard(clipboardValue: string, timeoutMs?: number): Promise<void>;
  abstract clearPendingClipboard(): Promise<any>;
}
