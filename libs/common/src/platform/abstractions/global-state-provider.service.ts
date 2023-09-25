export abstract class GlobalStateProviderService {
  create: <T>(location: StorageLocation, domainToken: DomainToken<T>) => State<T>;
}
