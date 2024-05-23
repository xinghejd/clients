import { PasswordHistoryResponse } from "../../../response/password-history.response";

// TODO: The response should also be versioned
export class PasswordHistoryDataV1 {
  password: string;
  lastUsedDate: string;

  constructor(response?: PasswordHistoryResponse) {
    if (response == null) {
      return;
    }

    this.password = response.password;
    this.lastUsedDate = response.lastUsedDate;
  }
}
