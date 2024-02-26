export abstract class AnonymousHubService {
  abstract createHubConnection(token: string): void;
  abstract stopHubConnection(): void;
}
