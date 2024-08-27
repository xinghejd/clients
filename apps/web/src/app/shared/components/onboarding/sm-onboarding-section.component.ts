import {
  Component,
  ContentChildren,
  ElementRef,
  Input,
  QueryList,
  SimpleChanges,
  ViewChild,
  OnChanges,
  AfterViewInit,
} from "@angular/core";

import { SMOnboardingTaskComponent } from "./sm-onboarding-task.component";

@Component({
  selector: "sm-app-onboarding",
  templateUrl: "./sm-onboarding-section.component.html",
})
export class SMOnboardingSectionComponent implements OnChanges, AfterViewInit {
  @ContentChildren(SMOnboardingTaskComponent) tasks: QueryList<SMOnboardingTaskComponent>;
  @Input() title: string;

  @Input()
  open: boolean = false;
  @ViewChild("details") detailsElement!: ElementRef<HTMLDetailsElement>;

  protected get amountCompleted(): number {
    return this.tasks.filter((task) => task.completed).length;
  }

  protected get barWidth(): number {
    return this.tasks.length === 0 ? 0 : (this.amountCompleted / this.tasks.length) * 100;
  }

  protected get getCompletionPercentage(): string {
    if (this.tasks.length <= 0) {
      return "0";
    }

    return Math.round((this.amountCompleted / this.tasks.length) * 100).toString();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["open"] && this.detailsElement) {
      this.updateDetailsState();
    }
  }

  ngAfterViewInit() {
    this.updateDetailsState();
  }

  updateDetailsState() {
    if (this.open) {
      this.detailsElement.nativeElement.setAttribute("open", "true");
    } else {
      this.detailsElement.nativeElement.removeAttribute("open");
    }
  }

  onToggle(event: Event) {
    this.open = (event.target as HTMLDetailsElement).open;
  }
}
