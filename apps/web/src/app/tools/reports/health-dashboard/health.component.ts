import { Component, OnInit } from "@angular/core";

import { HeaderModule } from "../../../layouts/header/header.module";
import { SharedModule } from "../../../shared";

import { HealthDashboardService } from "./health-dashboard.service";

@Component({
  selector: "tools-health",
  templateUrl: "health.component.html",
  standalone: true,
  imports: [SharedModule, HeaderModule],
})
export class HealthComponent implements OnInit {
  constructor(healthDashboardService: HealthDashboardService) {}

  ngOnInit() {}
}
