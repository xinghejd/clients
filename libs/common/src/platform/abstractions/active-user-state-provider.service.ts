export abstract class ActiveUserStateProviderService {
  create: <T>(location: StorageLocation, domainToken: DomainToken<T>) => State<T>;
}
