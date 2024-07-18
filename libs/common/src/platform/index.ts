import type { Container } from "inversify";

import { AccountService } from "../auth/abstractions/account.service";

import { LogService } from "./abstractions/log.service";
import { AbstractStorageService, ObservableStorageService } from "./abstractions/storage.service";
import { ConsoleLogService } from "./services/console-log.service";
import { MigrationBuilderService } from "./services/migration-builder.service";
import { MigrationRunner } from "./services/migration-runner";
import { StorageServiceProvider } from "./services/storage-service.provider";
import {
  ActiveUserStateProvider,
  DerivedStateProvider,
  GlobalStateProvider,
  SingleUserStateProvider,
  StateProvider,
} from "./state";
import { DefaultActiveUserStateProvider } from "./state/implementations/default-active-user-state.provider";
import { DefaultDerivedStateProvider } from "./state/implementations/default-derived-state.provider";
import { DefaultGlobalStateProvider } from "./state/implementations/default-global-state.provider";
import { DefaultSingleUserStateProvider } from "./state/implementations/default-single-user-state.provider";
import { DefaultStateProvider } from "./state/implementations/default-state.provider";
import { StateEventRegistrarService } from "./state/state-event-registrar.service";

export function addLogging(container: Container) {
  if (!container.isBound("IS_DEV")) {
    container.bind("IS_DEV").toConstantValue(false);
  }

  container
    .bind(LogService)
    .toDynamicValue((context) => new ConsoleLogService(context.container.get<boolean>("IS_DEV")))
    .inSingletonScope();
}

/**
 * @param container
 */
export function addState(container: Container) {
  if (!container.isBound(StorageServiceProvider)) {
    container
      .bind(StorageServiceProvider)
      .toDynamicValue(
        (context) =>
          new StorageServiceProvider(
            context.container.get<AbstractStorageService & ObservableStorageService>(
              "DISK_STORAGE",
            ),
            context.container.get<AbstractStorageService & ObservableStorageService>(
              "MEMORY_STORAGE",
            ),
          ),
      )
      .inSingletonScope();
  }

  container
    .bind(GlobalStateProvider)
    .toDynamicValue(
      (context) => new DefaultGlobalStateProvider(context.container.get(StorageServiceProvider)),
    )
    .inSingletonScope();

  container
    .bind(StateEventRegistrarService)
    .toDynamicValue(
      (context) =>
        new StateEventRegistrarService(
          context.container.get(GlobalStateProvider),
          context.container.get(StorageServiceProvider),
        ),
    )
    .inSingletonScope();

  container
    .bind(SingleUserStateProvider)
    .toDynamicValue(
      (context) =>
        new DefaultSingleUserStateProvider(
          context.container.get(StorageServiceProvider),
          context.container.get(StateEventRegistrarService),
        ),
    )
    .inSingletonScope();

  container
    .bind(ActiveUserStateProvider)
    .toDynamicValue(
      (context) =>
        new DefaultActiveUserStateProvider(
          context.container.get(AccountService),
          context.container.get(SingleUserStateProvider),
        ),
    )
    .inSingletonScope();

  container
    .bind(DerivedStateProvider)
    .toDynamicValue(() => new DefaultDerivedStateProvider())
    .inSingletonScope();

  container
    .bind(StateProvider)
    .toDynamicValue(
      (context) =>
        new DefaultStateProvider(
          context.container.get(ActiveUserStateProvider),
          context.container.get(SingleUserStateProvider),
          context.container.get(GlobalStateProvider),
          context.container.get(DerivedStateProvider),
        ),
    )
    .inSingletonScope();
}

export function addStateMigrations(container: Container) {
  container
    .bind(MigrationRunner)
    .toDynamicValue(
      (context) =>
        new MigrationRunner(
          context.container.get("DISK_STORAGE"),
          context.container.get(LogService),
          new MigrationBuilderService(),
          context.container.get("CLIENT_TYPE"),
        ),
    );
}

/**
 * Adds Core Platform Services to the provided container
 * @param container
 */
export function addCorePlatformServices(container: Container) {
  addLogging(container);
  addState(container);
  addStateMigrations(container);
}
