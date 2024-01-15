import { NgModule } from "@angular/core";

import { OldHeaderModule } from "../../../layouts/old-header/old-header.module";
import { SharedModule } from "../../../shared/shared.module";
import { ReportsSharedModule } from "../../../tools/reports";

import { OrganizationReportingRoutingModule } from "./organization-reporting-routing.module";
import { ReportingComponent } from "./reporting.component";
import { ReportsHomeComponent } from "./reports-home.component";

@NgModule({
  imports: [SharedModule, ReportsSharedModule, OrganizationReportingRoutingModule, OldHeaderModule],
  declarations: [ReportsHomeComponent, ReportingComponent],
})
export class OrganizationReportingModule {}
