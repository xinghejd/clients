import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Observable, map } from "rxjs";

@Component({
  selector: "app-header",
  templateUrl: "./old-header.component.html",
})
export class OldHeaderComponent {
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
