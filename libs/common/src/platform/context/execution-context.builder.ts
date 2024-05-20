import { Observable, firstValueFrom, isObservable } from "rxjs";

type GenericExecutionContext = Record<string, unknown>;

export class ExecutionContextPropertyBuilder<
  TExecutionContext extends Record<string, unknown>,
  TExecutionContextBuilder extends ExecutionContextBuilder<TExecutionContext>,
  TValue,
> {
  constructor(
    private readonly executionContextBuilder: TExecutionContextBuilder,
    private readonly predicate: ExecutionContextPredicate<TExecutionContext, TValue>,
  ) {}
  as<const TKey extends string>(
    propertyName: TKey,
  ): ExecutionContextBuilder<TExecutionContext & Record<TKey, TValue>> {
    return this.executionContextBuilder.addPropertyBuilder(propertyName, this.predicate);
  }
}

type ExecutionContextPredicate<TContext, T> = (context: TContext) => T | Promise<T> | Observable<T>;

export class ExecutionContextBuilder<T extends GenericExecutionContext> {
  // The type of these predicates are the context that is built by the time they are called and the value they return,
  // which is protected by the `with` method and `as` method on ExecutionContextPropertyBuilder.
  protected contextMap: { name: string; predicate: ExecutionContextPredicate<unknown, unknown> }[] =
    [];

  with<TValue>(
    contextBuilder: ExecutionContextPredicate<T, TValue>,
  ): ExecutionContextPropertyBuilder<T, typeof this, TValue> {
    return new ExecutionContextPropertyBuilder(this, contextBuilder);
  }

  withValue<TValue>(
    value: TValue | Promise<TValue>,
  ): ExecutionContextPropertyBuilder<T, typeof this, TValue> {
    return this.with(() => value);
  }

  withFirstValueFrom<TValue>(
    observable: Observable<TValue>,
  ): ExecutionContextPropertyBuilder<T, typeof this, TValue> {
    return this.with(() => observable);
  }

  async build(): Promise<T> {
    const context: Record<string, unknown> = {};
    for (const { name, predicate } of this.contextMap) {
      let predicateResult = predicate(context);
      if (isObservable(predicateResult)) {
        predicateResult = firstValueFrom(predicateResult);
      }

      context[name] = await predicateResult;
    }
    return context as T;
  }

  /**
   * @internal This method is part of the builder pattern and is not intended for external use.
   *
   * @param propertyName The name of the new context property
   * @param predicate The predicate that will be used to build the new context property
   * @returns A new ExecutionContextBuilder with the new context property added
   */
  addPropertyBuilder<
    TKey extends string,
    TValue,
    TValuePredicate extends ExecutionContextPredicate<T, TValue>,
  >(
    propertyName: TKey,
    predicate: TValuePredicate,
  ): ExecutionContextBuilder<T & Record<TKey, TValue>> {
    const result = new ExecutionContextBuilder<T & Record<TKey, TValue>>();
    result.contextMap = this.contextMap.concat({ name: propertyName, predicate });
    return result;
  }
}
