import { DependencyConstructor, FactoryEntry } from "./dependency-injection.abstractions";
import { DependencyLifecycle, DependencyLifecycleType } from "./dependency-lifecycle.enum";

class DependencyInjectionContainer {
  private static instances = new Map<DependencyConstructor<any>, any>();
  private static factories = new Map<DependencyConstructor<any>, FactoryEntry<any>>();
  private static scopedInstances = new WeakMap<object, Map<DependencyConstructor<any>, any>>();

  static remove<T>(target: DependencyConstructor<T>) {
    DependencyInjectionContainer.instances.delete(target);
  }

  static register<T>(
    target: DependencyConstructor<T>,
    factory: () => T,
    lifecycle: DependencyLifecycleType = DependencyLifecycle.Singleton,
  ) {
    DependencyInjectionContainer.factories.set(target, { factory, lifecycle });
  }

  static resolve<T>(target: DependencyConstructor<T>, scope?: object): T {
    const factoryEntry = DependencyInjectionContainer.factories.get(target);
    if (!factoryEntry) {
      throw new Error(`No factory registered for ${target.name}`);
    }

    if (factoryEntry.lifecycle === DependencyLifecycle.Singleton) {
      return DependencyInjectionContainer.resolveSingleton(target, factoryEntry);
    }

    if (factoryEntry.lifecycle === DependencyLifecycle.Scoped) {
      return DependencyInjectionContainer.resolveScoped(target, factoryEntry, scope);
    }

    return DependencyInjectionContainer.resolveTransient(factoryEntry);
  }

  private static resolveSingleton<T>(
    target: DependencyConstructor<T>,
    factoryEntry: FactoryEntry<T>,
  ): T {
    if (!DependencyInjectionContainer.instances.has(target)) {
      DependencyInjectionContainer.instances.set(target, factoryEntry.factory());
    }

    return DependencyInjectionContainer.instances.get(target);
  }

  private static resolveScoped<T>(
    target: DependencyConstructor<T>,
    factoryEntry: FactoryEntry<T>,
    scope: object,
  ): T {
    if (!scope) {
      throw new Error("Scope must be provided for scoped dependencies");
    }

    let scopedInstances = DependencyInjectionContainer.scopedInstances.get(scope);
    if (!scopedInstances) {
      scopedInstances = new Map<DependencyConstructor<any>, any>();
      DependencyInjectionContainer.scopedInstances.set(scope, scopedInstances);
    }

    if (!scopedInstances.has(target)) {
      scopedInstances.set(target, factoryEntry.factory());
    }

    return scopedInstances.get(target);
  }

  private static resolveTransient<T>(factoryEntry: FactoryEntry<T>): T {
    return factoryEntry.factory();
  }
}

export default DependencyInjectionContainer;
