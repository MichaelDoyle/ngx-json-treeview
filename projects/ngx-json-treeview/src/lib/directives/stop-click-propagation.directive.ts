import { Directive, HostListener, input } from '@angular/core';

@Directive({
  selector: '[ngxJtStopClickPropagation]',
  standalone: true,
})
export class StopClickPropagationDirective {
  enabled = input<boolean>(true, { alias: 'ngxJtStopClickPropagation' });

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (this.enabled()) {
      event.stopPropagation();
    }
  }
}
