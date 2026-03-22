import { Directive, input } from '@angular/core';

@Directive({
  selector: '[ngxJtStopClickPropagation]',
  standalone: true,
  host: {
    '(click)': 'onClick($event)',
  },
})
export class StopClickPropagationDirective {
  readonly enabled = input<boolean>(true, {
    alias: 'ngxJtStopClickPropagation',
  });

  protected onClick(event: Event): void {
    if (this.enabled()) {
      event.stopPropagation();
    }
  }
}
