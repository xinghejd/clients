import { Organization } from "../../admin-console/models/domain/organization";
import { IdentityTokenResponse } from "../models/response/identity-token.response";

export abstract class KeyConnectorService {
  abstract setMasterKeyFromUrl(url?: string): Promise<void>;
  abstract getManagingOrganization(): Promise<Organization>;
  abstract getUsesKeyConnector(): Promise<boolean>;
  abstract migrateUser(): Promise<void>;
  abstract userNeedsMigration(): Promise<boolean>;
  abstract convertNewSsoUserToKeyConnector(
    tokenResponse: IdentityTokenResponse,
    orgId: string,
  ): Promise<void>;
  abstract setUsesKeyConnector(enabled: boolean): Promise<void>;
  abstract setConvertAccountRequired(status: boolean): Promise<void>;
  abstract getConvertAccountRequired(): Promise<boolean>;
  abstract removeConvertAccountRequired(): Promise<void>;
  abstract clear(): Promise<void>;
}
