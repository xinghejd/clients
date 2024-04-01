import { Jsonify } from "type-fest";

import {
  ServerConfigData,
  ThirdPartyServerConfigData,
  EnvironmentServerConfigData,
} from "../../models/data/server-config.data";

const dayInMilliseconds = 24 * 3600 * 1000;

export class ServerConfig {
  version: string;
  gitHash: string;
  server?: ThirdPartyServerConfigData;
  environment?: EnvironmentServerConfigData;
  utcDate: Date;
  featureStates: { [key: string]: string } = {};

  constructor(serverConfigData: ServerConfigData) {
    this.version = serverConfigData.version;
    this.gitHash = serverConfigData.gitHash;
    this.server = serverConfigData.server;
    this.utcDate = new Date(serverConfigData.utcDate);
    this.environment = serverConfigData.environment;
    this.featureStates = serverConfigData.featureStates;

    if (this.server?.name == null && this.server?.url == null) {
      this.server = undefined;
    }
  }

  private getAgeInMilliseconds(): number {
    return new Date().getTime() - this.utcDate?.getTime();
  }

  isValid(): boolean {
    return this.getAgeInMilliseconds() <= dayInMilliseconds;
  }

  static fromJSON(obj: Jsonify<ServerConfig>): ServerConfig | undefined {
    if (obj == null) {
      return undefined;
    }

    return new ServerConfig(obj);
  }
}
