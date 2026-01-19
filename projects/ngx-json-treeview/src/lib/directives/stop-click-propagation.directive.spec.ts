import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StopClickPropagationDirective } from './stop-click-propagation.directive';

@Component({
  standalone: true,
  imports: [StopClickPropagationDirective],
  template: `
    <div (click)="parentClicked()">
      <div [ngxJtStopClickPropagation]="enabled()">
        <span (click)="childClicked()">Click Me</span>
      </div>
    </div>
  `,
})
class TestComponent {
  enabled = signal(true);
  parentClicked() {}
  childClicked() {}
}

describe('StopClickPropagationDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should stop click propagation when enabled', () => {
    const parentSpy = spyOn(component, 'parentClicked');
    const childSpy = spyOn(component, 'childClicked');

    const clickableSpan = fixture.debugElement.query(By.css('span'));
    clickableSpan.nativeElement.click();

    expect(childSpy).toHaveBeenCalled();
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('should not stop click propagation when disabled', async () => {
    component.enabled.set(false);
    await fixture.whenStable();

    const parentSpy = spyOn(component, 'parentClicked');
    const childSpy = spyOn(component, 'childClicked');

    const clickableSpan = fixture.debugElement.query(By.css('span'));
    clickableSpan.nativeElement.click();

    expect(childSpy).toHaveBeenCalled();
    expect(parentSpy).toHaveBeenCalled();
  });
});
