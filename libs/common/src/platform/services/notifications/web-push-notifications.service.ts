import { firstValueFrom } from "rxjs";

import { NotificationsService } from "../../../abstractions/notifications.service";
import { ConfigService } from "../../abstractions/config/config.service";
import { Utils } from "../../misc/utils";

import { WebPushNotificationsApiService } from "./web-push-notifications-api.service";

export class WebPushNotificationsService implements NotificationsService {
  constructor(
    private readonly serviceWorkerRegistration: ServiceWorkerRegistration,
    private readonly apiService: WebPushNotificationsApiService,
    private readonly configService: ConfigService,
  ) {
    (self as any).bwPush = this;
  }

  async init() {
    const subscription = await this.subscription();
    await this.apiService.putSubscription(subscription.toJSON());
  }

  private async subscription(): Promise<PushSubscription> {
    await this.GetPermission();
    const key = await firstValueFrom(this.configService.serverConfig$).then(
      (config) => config.push.vapidPublicKey,
    );
    const existingSub = await this.serviceWorkerRegistration.pushManager.getSubscription();

    let result: PushSubscription;
    if (existingSub && Utils.fromBufferToB64(existingSub.options?.applicationServerKey) === key) {
      result = existingSub;
    } else if (existingSub) {
      await existingSub.unsubscribe();
    }

    if (!result) {
      result = await this.serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
    }
    return result;
  }

  private async GetPermission() {
    if (self.Notification.permission !== "granted") {
      const p = await self.Notification.requestPermission();
      if (p !== "granted") {
        await this.GetPermission();
      }
    }
  }

  async updateConnection() {
    throw new Error("Method not implemented.");
  }

  async reconnectFromActivity() {
    throw new Error("Method not implemented.");
  }

  async disconnectFromInactivity() {
    throw new Error("Method not implemented.");
  }
}
