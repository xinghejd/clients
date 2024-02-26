import { BreachAccountResponse } from "../models/response/breach-account.response";

export abstract class AuditService {
  abstract passwordLeaked: (password: string) => Promise<number>;
  abstract breachedAccounts: (username: string) => Promise<BreachAccountResponse[]>;
}
