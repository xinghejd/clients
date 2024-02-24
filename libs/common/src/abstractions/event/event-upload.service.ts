export abstract class EventUploadService {
  abstract uploadEvents(userId?: string): Promise<void>;
}
