import { Subscription } from "rxjs";

/**
 * An abstract service that anyone can implement and then will be run at the start of the application.
 * There can be many implementation of this class and they will all be ran. Use this to create side effects
 * of your service on another service.
 *
 * @example
 * // How to register your instance of this class in Angular dependency injection.
 * {
 *   provide: ApplicationLifetimeService,
 *   useClass: MyLifetimeService,
 *   deps: [ MyDep ],
 *   multi: true,
 * }
 *
 * @example
 * // In MainBackground
 * this.applicationLifetimeServices.push(new MyLifetimeService(this.myDep));
 */
export abstract class ApplicationLifetimeService {
  /**
   * A method that runs at the start of the application.
   *
   * @returns A {@link Subscription} of the operation you've subscribed to.
   */
  onStart: () => Subscription;
}
