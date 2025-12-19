import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { StopClickPropagationDirective } from './stop-click-propagation.directive';

@Component({
  standalone: true,
  imports: [StopClickPropagationDirective],
  template: `
    <div (click)="parentClicked()">
      <div [ngxJtStopClickPropagation]="enabled">
        <span (click)="childClicked()">Click Me</span>
      </div>
    </div>
  `,
})
class TestComponent {
  enabled = true;
  parentClicked() {}
  childClicked() {}
}

describe('StopClickPropagationDirective', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should stop click propagation when enabled', () => {
    const parentSpy = spyOn(component, 'parentClicked');
    const childSpy = spyOn(component, 'childClicked');

    const clickableSpan = fixture.debugElement.query(By.css('span'));
    clickableSpan.nativeElement.click();

    expect(childSpy).toHaveBeenCalled();
    expect(parentSpy).not.toHaveBeenCalled();
  });

  it('should not stop click propagation when disabled', () => {
    component.enabled = false;
    fixture.detectChanges();

    const parentSpy = spyOn(component, 'parentClicked');
    const childSpy = spyOn(component, 'childClicked');

    const clickableSpan = fixture.debugElement.query(By.css('span'));
    clickableSpan.nativeElement.click();

    expect(childSpy).toHaveBeenCalled();
    expect(parentSpy).toHaveBeenCalled();
  });
});
