import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

@Component({
  selector: "sm-app-onboarding-task",
  templateUrl: "./sm-onboarding-task.component.html",
  host: {
    class: "tw-max-w-max",
  },
})
export class SMOnboardingTaskComponent implements OnChanges, AfterViewInit {
  @Input()
  completed = false;

  @Input()
  title: string;

  @Input()
  route: string | any[];

  @Input()
  description: string = "";

  @Input()
  externalLink: string = "";

  @Input()
  externalButton: string = "";

  @Input()
  callbackFunction: (setComplete: boolean) => void;

  @Input()
  onCompleteButtonPress: () => void;

  @Input()
  open: boolean = false;

  @ViewChild("details") detailsElement!: ElementRef<HTMLDetailsElement>;

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

  onClick() {
    if (this.callbackFunction) {
      this.callbackFunction(!this.completed);
      this.open = false;
      this.updateDetailsState();
    }
  }

  navigateExternalLink() {
    if (this.callbackFunction) {
      this.callbackFunction(!this.completed);
    }
    window.open(this.externalLink, "_blank");
  }

  completeButtonPress() {
    if (this.onCompleteButtonPress) {
      this.onCompleteButtonPress();
      this.open = false;
      this.updateDetailsState();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["open"] && this.detailsElement) {
      this.updateDetailsState();
    }
  }

  handleClick(ev: MouseEvent) {
    /**
     * If the main `ng-content` is clicked, we don't want to trigger the task's click handler.
     */
    ev.stopPropagation();
  }
}
