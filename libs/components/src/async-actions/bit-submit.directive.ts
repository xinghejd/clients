import { Directive, Input, OnDestroy, OnInit } from "@angular/core";
import { FormGroupDirective } from "@angular/forms";
import { filter, map, Observable, Subject, switchMap, takeUntil, withLatestFrom } from "rxjs";

import { Utils } from "@bitwarden/common/platform/misc/utils";

import { FunctionReturningAwaitable, functionToObservable } from "../utils/function-to-observable";

import { AsyncActionsService } from "./async-actions.service";

type State = "idle" | "loading" | "disabled";

/**
 * Allow a form to perform async actions on submit, disabling the form while the action is processing.
 */
@Directive({
  selector: "[formGroup][bitSubmit]",
})
export class BitSubmitDirective implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  state$!: Observable<State>;
  readonly context = Utils.newGuid();

  @Input("bitSubmit") handler: FunctionReturningAwaitable;
  @Input() allowDisabledFormSubmit?: boolean = false;

  // TODO: Migrate `import.component.ts` to use the new `AsyncActionsService`.
  loading$!: Observable<boolean>;
  disabled$!: Observable<boolean>;

  constructor(
    private formGroupDirective: FormGroupDirective,
    private asyncActionsService: AsyncActionsService,
  ) {}

  ngOnInit(): void {
    this.state$ = this.asyncActionsService.state$(this.context).pipe(
      map((state) => {
        if (state.status === "active" && state.origin === this) {
          return "loading";
        } else if (state.status === "active") {
          return "disabled";
        }

        return "idle";
      }),
    );

    this.formGroupDirective.ngSubmit
      .pipe(
        withLatestFrom(this.state$),
        filter(([_, state]) => state === "idle"),
        switchMap(() => {
          const awaitable = functionToObservable(this.handler);

          return this.asyncActionsService.execute(
            this.context,
            this,
            () => awaitable,
            this.destroy$,
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe();

    this.loading$ = this.state$.pipe(map((state) => state === "loading"));
    this.disabled$ = this.state$.pipe(map((state) => state === "disabled"));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
