import { firstValueFrom, Observable, Subject, Subscription, throwError, timeout } from "rxjs";

/** Test class to enable async awaiting of observable emissions */
export class ObservableTracker<T> {
  private subscription: Subscription;
  private emissionReceived = new Subject<T>();
  private errorThrown = new Subject<unknown>();
  emissions: T[] = [];
  errors: unknown[] = [];
  constructor(observable: Observable<T>) {
    this.emissions = this.trackEmissions(observable);
  }

  get complete() {
    return this.subscription.closed;
  }

  /** Unsubscribes from the observable */
  unsubscribe() {
    this.subscription.unsubscribe();
    this.emissionReceived.complete();
    this.errorThrown.complete();
  }

  /**
   * Awaits the next emission from the observable, or throws if the timeout is exceeded
   * @param msTimeout The maximum time to wait for another emission before throwing
   * @returns The next emission from the observable
   * @throws If the timeout is exceeded
   */
  async expectEmission(msTimeout = 50): Promise<T> {
    return await firstValueFrom(
      this.emissionReceived.pipe(
        timeout({
          first: msTimeout,
          with: () => throwError(() => new Error("Timeout exceeded waiting for another emission.")),
        }),
      ),
    );
  }

  async expectError(msTimeout = 50): Promise<unknown> {
    return await firstValueFrom(
      this.errorThrown.pipe(
        timeout({
          first: msTimeout,
          with: () => throwError(() => new Error("Timeout exceeded waiting for an error.")),
        }),
      ),
    );
  }

  /** Awaits until the total number of emissions observed by this tracker equals or exceeds {@link count}
   * @param count The number of emissions to wait for
   */
  async pauseUntilReceived(count: number, msTimeout = 50): Promise<T[]> {
    while (this.emissions.length < count) {
      await this.expectEmission(msTimeout);
    }
    return this.emissions;
  }

  async pauseUntilErrorsReceived(count: number, msTimeout = 50): Promise<unknown[]> {
    while (this.errors.length < count) {
      await this.expectError(msTimeout);
    }
    return this.errors;
  }

  private trackEmissions(observable: Observable<T>): T[] {
    const emissions: T[] = [];
    this.emissionReceived.subscribe((value) => {
      emissions.push(value);
    });
    this.subscription = observable.subscribe(
      (value) => {
        if (value == null) {
          this.emissionReceived.next(null);
          return;
        }

        switch (typeof value) {
          case "string":
          case "number":
          case "boolean":
            this.emissionReceived.next(value);
            break;
          case "symbol":
            // Cheating types to make symbols work at all
            this.emissionReceived.next(value as T);
            break;
          default: {
            this.emissionReceived.next(clone(value));
          }
        }
      },
      (e: unknown) => {
        this.errorThrown.next(e);
        this.errors.push(e);
      },
    );

    return emissions;
  }
}
function clone(value: any): any {
  if (global.structuredClone != undefined) {
    return structuredClone(value);
  } else {
    return JSON.parse(JSON.stringify(value));
  }
}

/** A test helper that builds an @see{@link ObservableTracker}, which can be used to assert things about the
 * emissions of the given observable
 * @param observable The observable to track
 */
export function subscribeTo<T>(observable: Observable<T>) {
  return new ObservableTracker(observable);
}
