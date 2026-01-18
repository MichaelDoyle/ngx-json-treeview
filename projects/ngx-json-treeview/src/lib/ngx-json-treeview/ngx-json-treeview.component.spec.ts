import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';

async function setupTest({
  json = {},
}: {
  json?: any;
} = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    imports: [NgxJsonTreeviewComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('json', json);
  await fixture.whenStable();
  const loader = TestbedHarnessEnvironment.loader(fixture);

  return { component, fixture, loader };
}

describe('NgxJsonTreeviewComponent', () => {
  it('should create', async () => {
    const { component } = await setupTest();
    expect(component).toBeTruthy();
  });
});
