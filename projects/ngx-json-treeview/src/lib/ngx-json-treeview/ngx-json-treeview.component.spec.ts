import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';
import { NgxJsonTreeviewNodeHarness } from './testing/ngx-json-treeview.harness';

async function setupTest({
  json = {},
  depth = 0,
}: {
  depth?: number;
  json?: any;
} = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    imports: [NgxJsonTreeviewComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
  fixture.componentRef.setInput('depth', depth);
  fixture.componentRef.setInput('json', json);
  await fixture.whenStable();

  const component = fixture.componentInstance;
  const loader = TestbedHarnessEnvironment.loader(fixture);

  return { component, fixture, loader };
}

describe('NgxJsonTreeviewComponent', () => {
  it('should create', async () => {
    const { component } = await setupTest();
    expect(component).toBeTruthy();
  });

  it('should reset expandedSegments when depth changes', async () => {
    const { fixture, loader } = await setupTest({
      depth: 2,
      json: { nested: { deep: { inner: 1 } } },
    });

    const deepNode = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'deep' })
    );
    expect(await deepNode.isExpanded()).toBe(true);

    await deepNode.collapse();

    expect(await deepNode.isExpanded()).toBe(false);

    fixture.componentRef.setInput('depth', 3);
    await fixture.whenStable();

    expect(await deepNode.isExpanded()).toBe(true);
  });
});
