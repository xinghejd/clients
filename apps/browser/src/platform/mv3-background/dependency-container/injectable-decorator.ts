import "reflect-metadata";

import DependencyContainer from "./dependency-container";
import { DependencyConstructor } from "./dependency-container.abstractions";

// TODO: GC - Consider whether we need a decorator for this, or if we can just use the DI container directly
function Injectable(): ClassDecorator {
  return (target) => {
    const targetConstructor = target as unknown as DependencyConstructor<any>;
    // Register a factory in the DI container
    DependencyContainer.register(targetConstructor, () => {
      const params = Reflect.getMetadata("design:paramtypes", targetConstructor) || [];
      const injections = params.map((param: any) => DependencyContainer.resolve(param));
      return new targetConstructor(...injections);
    });
  };
}

function Inject(token: any): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    // Metadata logic, if necessary
  };
}

export { Injectable, Inject };
