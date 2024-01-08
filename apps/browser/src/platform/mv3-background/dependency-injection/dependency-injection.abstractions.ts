import { DependencyLifecycleType } from "./dependency-lifecycle.enum";

type DependencyConstructor<T> = { new (...args: any[]): T };

type DependencyProviderData<T> = {
  provide: DependencyConstructor<T>;
  deps?: DependencyConstructor<T>[];
  params?: any[];
  lifecycle?: DependencyLifecycleType;
  useFactory: (...params: any[]) => T;
};

type FactoryEntry<T> = {
  factory: () => T;
  lifecycle: DependencyLifecycleType;
};

export { DependencyConstructor, DependencyProviderData, FactoryEntry };
