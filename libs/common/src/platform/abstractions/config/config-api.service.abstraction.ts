import { ServerConfigResponse } from "../../models/response/server-config.response";

export abstract class ConfigApiServiceAbstraction {
  abstract get(): Promise<ServerConfigResponse>;
}
