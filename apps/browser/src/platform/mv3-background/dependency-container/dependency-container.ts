import { DependencyConstructor, FactoryEntry } from "./dependency-container.abstractions";
import { DependencyLifecycle, DependencyLifecycleType } from "./dependency-lifecycle.enum";

class DependencyContainer {
  private static instances = new Map<DependencyConstructor<any>, any>();
  private static factories = new Map<DependencyConstructor<any>, FactoryEntry>();
  private static scopedInstances = new WeakMap<object, Map<DependencyConstructor<any>, any>>();

  static remove<T>(target: DependencyConstructor<T>) {
    DependencyContainer.instances.delete(target);
  }

  static register<T>(
    target: DependencyConstructor<T>,
    factory: () => T,
    lifecycle: DependencyLifecycleType = DependencyLifecycle.Singleton,
  ) {
    DependencyContainer.factories.set(target, { factory, lifecycle });
  }

  static resolve<T>(target: DependencyConstructor<T>, scope?: object): T {
    const factoryEntry = DependencyContainer.factories.get(target);
    if (!factoryEntry) {
      throw new Error(`No factory registered for ${target.name}`);
    }

    if (factoryEntry.lifecycle === DependencyLifecycle.Singleton) {
      return DependencyContainer.resolveSingleton(target, factoryEntry);
    }

    if (factoryEntry.lifecycle === DependencyLifecycle.Scoped) {
      return DependencyContainer.resolveScoped(target, factoryEntry, scope);
    }

    return DependencyContainer.resolveTransient(factoryEntry);
  }

  private static resolveSingleton<T>(
    target: DependencyConstructor<T>,
    factoryEntry: FactoryEntry,
  ): T {
    if (!DependencyContainer.instances.has(target)) {
      DependencyContainer.instances.set(target, factoryEntry.factory());
    }

    return DependencyContainer.instances.get(target);
  }

  private static resolveScoped<T>(
    target: DependencyConstructor<T>,
    factoryEntry: FactoryEntry,
    scope: object,
  ): T {
    if (!scope) {
      throw new Error("Scope must be provided for scoped dependencies");
    }

    let scopedInstances = DependencyContainer.scopedInstances.get(scope);
    if (!scopedInstances) {
      scopedInstances = new Map<DependencyConstructor<any>, any>();
      DependencyContainer.scopedInstances.set(scope, scopedInstances);
    }

    if (!scopedInstances.has(target)) {
      scopedInstances.set(target, factoryEntry.factory());
    }

    return scopedInstances.get(target);
  }

  private static resolveTransient<T>(factoryEntry: FactoryEntry): T {
    return factoryEntry.factory();
  }
}

export default DependencyContainer;
