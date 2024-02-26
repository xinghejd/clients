import { EventType } from "../../enums";

export abstract class EventCollectionService {
  abstract collect(
    eventType: EventType,
    cipherId?: string,
    uploadImmediately?: boolean,
    organizationId?: string,
  ): Promise<any>;
}
