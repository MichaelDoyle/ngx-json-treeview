import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';
import { NgxJsonTreeviewNodeHarness } from './testing/ngx-json-treeview.harness';

async function setupTest({
  json = {},
  depth = 0,
  enableClickableValues = false,
}: {
  depth?: number;
  enableClickableValues?: boolean;
  json?: any;
} = {}) {
  await TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
    imports: [NgxJsonTreeviewComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
  fixture.componentRef.setInput('depth', depth);
  fixture.componentRef.setInput('json', json);
  fixture.componentRef.setInput('enableClickableValues', enableClickableValues);
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

    const deepNodeAfter = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'deep' })
    );
    expect(await deepNodeAfter.isExpanded()).toBe(true);
  });

  it('should expand a collapsed node when clicking value preview with enableClickableValues=true', async () => {
    const { fixture, loader } = await setupTest({
      depth: 0,
      enableClickableValues: true,
      json: { user: { name: 'Alice', age: 30 } },
    });

    const userNode = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'user' })
    );
    expect(await userNode.isExpanded()).toBe(false);

    // Click the value preview button on the collapsed node via harness
    await userNode.clickValue();
    await fixture.whenStable();

    expect(await userNode.isExpanded()).toBe(true);
  });
});
