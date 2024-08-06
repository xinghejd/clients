import { Jsonify } from "type-fest";

import { AllowedFeatureFlagTypes } from "../../../enums/feature-flag.enum";
import {
  ServerConfigData,
  ThirdPartyServerConfigData,
  EnvironmentServerConfigData,
} from "../../models/data/server-config.data";

const dayInMilliseconds = 24 * 3600 * 1000;

export enum PushTechnology {
  SignalR = 0,
  WebPush = 1,
}

export class ServerConfig {
  version: string;
  gitHash: string;
  server?: ThirdPartyServerConfigData;
  environment?: EnvironmentServerConfigData;
  utcDate: Date;
  featureStates: { [key: string]: AllowedFeatureFlagTypes } = {};
  push: {
    pushTechnology: PushTechnology;
    vapidPublicKey?: string;
  };

  constructor(serverConfigData: ServerConfigData) {
    this.version = serverConfigData.version;
    this.gitHash = serverConfigData.gitHash;
    this.server = serverConfigData.server;
    this.utcDate = new Date(serverConfigData.utcDate);
    this.environment = serverConfigData.environment;
    this.featureStates = serverConfigData.featureStates;
    this.push =
      serverConfigData.push == null
        ? {
            pushTechnology: PushTechnology.SignalR,
          }
        : {
            pushTechnology: serverConfigData.push.pushTechnology,
            vapidPublicKey: serverConfigData.push.vapidPublicKey,
          };

    if (this.server?.name == null && this.server?.url == null) {
      this.server = null;
    }
  }

  private getAgeInMilliseconds(): number {
    return new Date().getTime() - this.utcDate?.getTime();
  }

  isValid(): boolean {
    return this.getAgeInMilliseconds() <= dayInMilliseconds;
  }

  static fromJSON(obj: Jsonify<ServerConfig>): ServerConfig {
    if (obj == null) {
      return null;
    }

    return new ServerConfig(obj);
  }
}
