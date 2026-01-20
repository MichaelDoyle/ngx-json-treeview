import { Directive, HostListener, input } from '@angular/core';

@Directive({
  selector: '[ngxJtStopClickPropagation]',
  standalone: true,
})
export class StopClickPropagationDirective {
  readonly enabled = input<boolean>(true, {
    alias: 'ngxJtStopClickPropagation',
  });

  @HostListener('click', ['$event'])
  protected onClick(event: Event): void {
    if (this.enabled()) {
      event.stopPropagation();
    }
  }
}
