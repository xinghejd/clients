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
export class SMOnboardingTaskComponent {
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

  private _open: boolean;
  @Input() get open(): boolean {
    return this._open ? true : null;
  }
  set open(value: boolean) {
    this._open = value;
  }

  @ViewChild("details") detailsElement!: ElementRef<HTMLDetailsElement>;


  onToggle(event: Event) {
    this.open = (event.target as HTMLDetailsElement).open;
  }

  onClick() {
    if (this.callbackFunction) {
      this.callbackFunction(!this.completed);
      this.open = null;
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
      this.open = null;
    }
  }


  handleClick(ev: MouseEvent) {
    /**
     * If the main `ng-content` is clicked, we don't want to trigger the task's click handler.
     */
    ev.stopPropagation();
  }
}
