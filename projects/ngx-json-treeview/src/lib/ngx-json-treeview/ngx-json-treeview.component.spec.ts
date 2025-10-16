import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';

async function setupTest({
  json = {},
}: {
  json?: any;
} = {}) {
  await TestBed.configureTestingModule({
    imports: [NgxJsonTreeviewComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
  const component = fixture.componentInstance;
  fixture.componentRef.setInput('json', json);
  fixture.detectChanges();
  const loader = TestbedHarnessEnvironment.loader(fixture);

  return { component, fixture, loader };
}

describe('NgxJsonTreeviewComponent', () => {
  it('should create', async () => {
    const { component } = await setupTest();
    expect(component).toBeTruthy();
  });
});
