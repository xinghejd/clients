import { Injectable } from "@angular/core";

import { LegacyMessageWrapper } from "../models/native-messaging/legacy-message-wrapper";
import { Message } from "../models/native-messaging/message";

import { BiometricMessageHandlerService } from "./biometric-native-messaging.service";
import { DDGMessageHandlerService } from "./ddg-message-handler.service";

@Injectable()
export class NativeMessagingService {
  constructor(
    private ddgMessageHandler: DDGMessageHandlerService,
    private biometricMessageHandler: BiometricMessageHandlerService,
  ) {}

  init() {
    ipc.platform.nativeMessaging.onMessage((message) => this.messageHandler(message));
  }

  private async messageHandler(msg: LegacyMessageWrapper | Message) {
    const outerMessage = msg as Message;
    if (outerMessage.version) {
      // If there is a version, it is a using the protocol created for the DuckDuckGo integration
      await this.ddgMessageHandler.handleMessage(outerMessage);
      return;
    } else {
      await this.biometricMessageHandler.handleMessage(msg as LegacyMessageWrapper);
      return;
    }
  }
}
