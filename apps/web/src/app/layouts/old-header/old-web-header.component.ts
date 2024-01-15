import { Component, Input } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, Observable } from "rxjs";

/**
 * Temporary component which will be replaced by the new header component after Vertical Vault Refresh is done
 */
@Component({
  selector: "app-header",
  templateUrl: "./old-web-header.component.html",
})
export class OldWebHeaderComponent {
  /**
   * Custom title that overrides the route data `titleId`
   */
  @Input() title: string;

  protected routeData$: Observable<{ titleId: string }>;

  constructor(private route: ActivatedRoute) {
    this.routeData$ = this.route.data.pipe(
      map((params) => {
        return {
          titleId: params.titleId,
        };
      }),
    );
  }
}
