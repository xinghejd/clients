import {
  concat,
  concatMap,
  defer,
  fromEvent,
  map,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
} from "rxjs";

import { NotificationResponse } from "../../../models/response/notification.response";
import { UserId } from "../../../types/guid";
import { ConfigService } from "../../abstractions/config/config.service";
import { PushTechnology } from "../../abstractions/config/server-config";
import { SupportStatus } from "../../misc/support-status";
import { Utils } from "../../misc/utils";
import { WebPushNotificationsApiService } from "../../services/notifications/web-push-notifications-api.service";

// Ref: https://w3c.github.io/push-api/#the-pushsubscriptionchange-event
interface PushSubscriptionChangeEvent extends ExtendableEvent {
  readonly newSubscription?: PushSubscription;
  readonly oldSubscription?: PushSubscription;
}

export interface WebPushConnector {
  connect$(userId: UserId): Observable<NotificationResponse>;
}

type MySupport = SupportStatus<WebPushConnector>;

export class DefaultWebPushConnectionService implements WebPushConnector {
  private pushEvent = new Subject<PushEvent>();
  private pushChangeEvent = new Subject<PushSubscriptionChangeEvent>();

  constructor(
    private readonly isClientSupported: boolean,
    private readonly configService: ConfigService,
    private readonly webPushApiService: WebPushNotificationsApiService,
    private readonly serviceWorkerRegistration: ServiceWorkerRegistration,
  ) {}

  start(): Subscription {
    const subscription = new Subscription(() => {
      this.pushEvent.complete();
      this.pushChangeEvent.complete();
      this.pushEvent = new Subject<PushEvent>();
      this.pushChangeEvent = new Subject<PushSubscriptionChangeEvent>();
    });

    const pushEventSubscription = fromEvent(self, "push").subscribe(this.pushEvent);

    const pushChangeEventSubscription = fromEvent(self, "pushsubscriptionchange").subscribe(
      this.pushChangeEvent,
    );

    subscription.add(pushEventSubscription);
    subscription.add(pushChangeEventSubscription);

    return subscription;
  }

  supportStatus$(userId: UserId): Observable<SupportStatus<WebPushConnector>> {
    if (!this.isClientSupported) {
      // If the client doesn't support it, nothing more we can check
      return of({ type: "not-supported", reason: "client-not-supported" } satisfies MySupport);
    }

    // Check the server config to see if it supports sending WebPush notifications
    return this.configService.serverConfig$.pipe(
      map((config) => {
        if (config.push?.pushTechnology === PushTechnology.WebPush) {
          return {
            type: "supported",
            service: this,
          } satisfies MySupport;
        }

        return { type: "not-supported", reason: "server-not-configured" } satisfies MySupport;
      }),
    );
  }

  connect$(userId: UserId): Observable<NotificationResponse> {
    if (!this.isClientSupported) {
      // Fail as early as possible when connect$ should not have been called.
      throw new Error(
        "This client does not support WebPush, call 'supportStatus$' to check if the WebPush is supported before calling 'connect$'",
      );
    }

    // Do connection
    return this.configService.serverConfig$.pipe(
      switchMap((config) => {
        if (config.push?.pushTechnology !== PushTechnology.WebPush) {
          throw new Error(
            "This client does not support WebPush, call 'supportStatus$' to check if the WebPush is supported before calling 'connect$'",
          );
        }

        // Create connection
        return this.getOrCreateSubscription$(config.push.vapidPublicKey).pipe(
          concatMap((subscription) => {
            return defer(async () => {
              await this.webPushApiService.putSubscription(subscription.toJSON());
            }).pipe(
              switchMap(() => this.pushEvent),
              map((e) => new NotificationResponse(e.data.json().data)),
            );
          }),
        );
      }),
    );
  }

  getOrCreateSubscription$(key: string) {
    return concat(
      defer(async () => await this.serviceWorkerRegistration.pushManager.getSubscription()).pipe(
        concatMap((subscription) => {
          if (subscription == null) {
            return this.pushManagerSubscribe$(key);
          }

          const subscriptionKey = Utils.fromBufferToUrlB64(
            subscription.options?.applicationServerKey,
          );
          if (subscriptionKey !== key) {
            // There is a subscription, but it's not for the current server, unsubscribe and then make a new one
            return defer(() => subscription.unsubscribe()).pipe(
              concatMap(() => this.pushManagerSubscribe$(key)),
            );
          }

          return of(subscription);
        }),
      ),
      this.pushChangeEvent.pipe(
        concatMap((event) => {
          // TODO: Is this enough, do I need to do something with oldSubscription
          return of(event.newSubscription);
        }),
      ),
    );
  }

  private pushManagerSubscribe$(key: string) {
    return defer(
      async () =>
        await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }),
    );
  }
}
