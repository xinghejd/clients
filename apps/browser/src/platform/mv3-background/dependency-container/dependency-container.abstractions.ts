import { DependencyLifecycleType } from "./dependency-lifecycle.enum";

type DependencyConstructor<T> = { new (...args: any[]): T };

type FactoryEntry = {
  factory: () => any;
  lifecycle: DependencyLifecycleType;
};

export { DependencyConstructor, FactoryEntry };
