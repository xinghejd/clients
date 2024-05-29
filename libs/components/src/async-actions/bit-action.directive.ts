import { Directive, HostListener, Input, OnDestroy, OnInit, Optional } from "@angular/core";
import { firstValueFrom, map, Observable, Subject, takeUntil } from "rxjs";

import { Utils } from "@bitwarden/common/platform/misc/utils";

import { ButtonLikeAbstraction } from "../shared/button-like.abstraction";
import { FunctionReturningAwaitable } from "../utils/function-to-observable";

import { AsyncActionsService } from "./async-actions.service";
import { AsyncContextProvider } from "./async-context-provider.abstraction";

type State = "idle" | "loading" | "disabled";

/**
 * Allow a single button to perform async actions on click and reflect the progress in the UI by automatically
 * activating the loading effect while the action is processed.
 */
@Directive({
  selector: "[bitAction]",
})
export class BitActionDirective implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly fallbackContext = Utils.newGuid();

  private state$!: Observable<State>;

  @Input("bitAction") handler: FunctionReturningAwaitable;

  constructor(
    private buttonComponent: ButtonLikeAbstraction,
    private asyncActionsService: AsyncActionsService,
    @Optional() private contextProvider?: AsyncContextProvider,
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

    this.state$.pipe(takeUntil(this.destroy$)).subscribe((state) => {
      this.buttonComponent.disabled = state === "disabled";
      this.buttonComponent.loading = state === "loading";
    });
  }

  private get context() {
    return this.contextProvider?.context ?? this.fallbackContext;
  }

  @HostListener("click")
  protected async onClick() {
    const state = await firstValueFrom(this.state$);

    if (!this.handler || state != "idle" || this.buttonComponent.disabled) {
      return;
    }

    await this.asyncActionsService.execute(this.context, this, this.handler, this.destroy$);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
