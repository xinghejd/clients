import { ActiveUserState } from "../interfaces/active-user-state";
import { KeyDefinition } from "../types/key-definition";

export abstract class ActiveUserStateProvider {
  create: <T>(keyDefinition: KeyDefinition<T>) => ActiveUserState<T>;
}
