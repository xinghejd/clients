import { ProviderData } from "../models/data/provider.data";
import { Provider } from "../models/domain/provider";

export abstract class ProviderService {
  abstract get(id: string): Promise<Provider>;
  abstract getAll(): Promise<Provider[]>;
  abstract save(providers: { [id: string]: ProviderData }): Promise<any>;
}
