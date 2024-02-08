import { Pipe, OnDestroy, PipeTransform, ChangeDetectorRef, NgZone } from "@angular/core";
import { Unsubscribable, Subscribable, Observable } from "rxjs";

/**
 * @ngModule CommonModule
 * @description
 *
 * Unwraps a value from an asynchronous primitive.
 *
 * The `async` pipe subscribes to an `Observable` or `Promise` and returns the latest value it has
 * emitted. When a new value is emitted, the `async` pipe marks the component to be checked for
 * changes. When the component gets destroyed, the `async` pipe unsubscribes automatically to avoid
 * potential memory leaks. When the reference of the expression changes, the `async` pipe
 * automatically unsubscribes from the old `Observable` or `Promise` and subscribes to the new one.
 *
 * @usageNotes
 *
 * ### Examples
 *
 * This example binds a `Promise` to the view. Clicking the `Resolve` button resolves the
 * promise.
 *
 * {@example common/pipes/ts/async_pipe.ts region='AsyncPipePromise'}
 *
 * It's also possible to use `async` with Observables. The example below binds the `time` Observable
 * to the view. The Observable continuously updates the view with the current time.
 *
 * {@example common/pipes/ts/async_pipe.ts region='AsyncPipeObservable'}
 *
 * @publicApi
 */
@Pipe({
  name: "ngZonedAsync",
  pure: false,
  standalone: true,
})
export class NgZonedAsyncPipe implements OnDestroy, PipeTransform {
  private _ref: ChangeDetectorRef | null;
  private _latestValue: any = null;

  private _subscription: Unsubscribable | null = null;
  private _obj: Subscribable<any> | null = null;

  constructor(
    ref: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    // Assign `ref` into `this._ref` manually instead of declaring `_ref` in the constructor
    // parameter list, as the type of `this._ref` includes `null` unlike the type of `ref`.
    this._ref = ref;
  }

  ngOnDestroy(): void {
    if (this._subscription) {
      this._dispose();
    }
    // Clear the `ChangeDetectorRef` and its association with the view data, to mitigate
    // potential memory leaks in Observables that could otherwise cause the view data to
    // be retained.
    // https://github.com/angular/angular/issues/17624
    this._ref = null;
  }

  // NOTE(@benlesh): Because Observable has deprecated a few call patterns for `subscribe`,
  // TypeScript has a hard time matching Observable to Subscribable, for more information
  // see https://github.com/microsoft/TypeScript/issues/43643

  transform<T>(obj: Observable<T> | Subscribable<T>): T | null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  transform<T>(obj: null | undefined): null;
  transform<T>(obj: Observable<T> | Subscribable<T> | null | undefined): T | null {
    if (!this._obj) {
      if (obj) {
        this._subscribe(obj);
      }
      return this._latestValue;
    }

    if (obj !== this._obj) {
      this._dispose();
      return this.transform(obj);
    }

    return this._latestValue;
  }

  private _subscribe(obj: Subscribable<any>): void {
    this._obj = obj;
    this._subscription = obj.subscribe({
      next: (value: any) => {
        this.ngZone.run(() => this._updateLatestValue(obj, value));
      },
      error: (e: any) => {
        throw e;
      },
    });
  }

  private _dispose(): void {
    // Note: `dispose` is only called if a subscription has been initialized before, indicating
    // that `this._strategy` is also available.
    this._subscription.unsubscribe();
    this._latestValue = null;
    this._subscription = null;
    this._obj = null;
  }

  private _updateLatestValue(async: any, value: any): void {
    if (async === this._obj) {
      this._latestValue = value;
      // Note: `this._ref` is only cleared in `ngOnDestroy` so is known to be available when a
      // value is being updated.
      this._ref!.markForCheck();
    }
  }
}
