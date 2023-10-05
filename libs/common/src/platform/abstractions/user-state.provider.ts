import { UserState } from "../interfaces/user-state";
import { KeyDefinition } from "../state/key-definition";

export abstract class UserStateProvider {
  create: <T>(keyDefinition: KeyDefinition<T>) => UserState<T>;
}
