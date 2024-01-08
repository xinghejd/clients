const DependencyLifecycle = {
  Singleton: "singleton",
  Transient: "transient",
  Scoped: "scoped",
} as const;

type DependencyLifecycleType = (typeof DependencyLifecycle)[keyof typeof DependencyLifecycle];

export {
  DependencyLifecycle as DependencyLifecycle,
  DependencyLifecycleType as DependencyLifecycleType,
};
