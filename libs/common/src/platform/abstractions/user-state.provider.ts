import { UserState } from "../interfaces/user-state";
import { KeyDefinition } from "../types/key-definition";

export abstract class UserStateProvider {
  create: <T>(keyDefinition: KeyDefinition<T>) => UserState<T>;
}
