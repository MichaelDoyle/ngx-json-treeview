import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { IsClickableValueFn, Segment } from '../types';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';
import { NgxJsonTreeviewNodeHarness } from './testing/ngx-json-treeview.harness';

async function setupTest({
  json = {},
  depth = 0,
  enableClickableValues = false,
  isClickableValue,
}: {
  depth?: number;
  enableClickableValues?: boolean;
  isClickableValue?: IsClickableValueFn;
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
  if (isClickableValue !== undefined) {
    fixture.componentRef.setInput('isClickableValue', isClickableValue);
  }
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

  it('should truncate collapsed preview strings using default maxPreviewLength (80)', async () => {
    const largeObj: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      largeObj[`key_${i}`] = `val_${i}`;
    }
    const { loader } = await setupTest({
      depth: 0,
      json: { data: largeObj },
    });

    const node = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'data' })
    );
    const value = await node.getValue();
    expect(value.length).toBe(80);
    expect(value.endsWith('…')).toBe(true);
  });

  it('should respect custom maxPreviewLength input and propagate to children', async () => {
    const largeObj: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      largeObj[`key_${i}`] = `val_${i}`;
    }
    const { fixture, loader } = await setupTest({
      depth: 1,
      json: { outer: { inner: largeObj } },
    });

    fixture.componentRef.setInput('maxPreviewLength', 30);
    await fixture.whenStable();

    const node = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'inner' })
    );
    const value = await node.getValue();
    expect(value.length).toBe(30);
    expect(value.endsWith('…')).toBe(true);
  });

  it('should render preview string button and trailing comma inside segment-preview-container', async () => {
    const { fixture } = await setupTest({
      depth: 0,
      json: { a: { b: 1 }, c: 2 },
    });

    const containerEl = fixture.nativeElement.querySelector(
      '.segment-preview-container'
    );
    expect(containerEl).not.toBeNull();

    const button = containerEl.querySelector('button.segment-label');
    const comma = containerEl.querySelector('.punctuation');

    expect(button).not.toBeNull();
    expect(comma).not.toBeNull();
    expect(comma.textContent).toBe(',');
  });

  it('should not apply single-line nowrap ellipsis layout to primitive string nodes', async () => {
    const { fixture } = await setupTest({
      depth: 1,
      json: { text: 'long primitive string value' },
    });

    const stringMainEl = fixture.nativeElement.querySelector(
      '.segment-type-string > .segment-main'
    );
    expect(stringMainEl).not.toBeNull();
    const computedStyle = getComputedStyle(stringMainEl);
    expect(computedStyle.whiteSpace).not.toBe('nowrap');
  });

  describe('decycle', () => {
    it('lets a nested tree use the decycled subtree it is given', async () => {
      // Only the root copies the graph: the tree for "a" reads the very
      // objects the root's copy holds, instead of decycling them again.
      const { fixture } = await setupTest({
        depth: 3,
        json: { a: { b: { c: 1 } } },
      });
      const root = fixture.componentInstance as any;
      const nested = fixture.debugElement.query(
        By.directive(NgxJsonTreeviewComponent)
      ).componentInstance as any;
      const aCopy = root.segments()[0].value;
      expect(nested._currentDepth()).toBe(1);
      expect(nested.segments()[0].value).toBe(aCopy.b);
    });

    it('renders a cycle found several levels down as a $ref to the root', async () => {
      const json: any = { a: { b: { c: 1 } } };
      json.a.b.back = json;
      const { loader } = await setupTest({ depth: 3, json });

      const back = await loader.getHarness(
        NgxJsonTreeviewNodeHarness.with({ key: 'back' })
      );
      await back.expand();
      const ref = await loader.getHarness(
        NgxJsonTreeviewNodeHarness.with({ key: '$ref' })
      );
      expect(await ref.getValue()).toBe('"$"');
    });
  });

  it('should emit the clicked segment at the root when clicking a nested value with isClickableValue', async () => {
    const { component, loader } = await setupTest({
      depth: -1,
      enableClickableValues: true,
      isClickableValue: (segment) => segment.key === 'target',
      json: { level1: { level2: { target: 'hello' } } },
    });

    const emittedSegments: Segment[] = [];
    component.onValueClick.subscribe((segment) => {
      emittedSegments.push(segment);
    });

    const targetNode = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'target' })
    );
    await targetNode.clickValue();

    expect(emittedSegments).toEqual([
      expect.objectContaining({
        key: 'target',
        value: 'hello',
        path: 'level1.level2.target',
      }),
    ]);
  });

  it('should only invoke onValueClickHandler once when clicking a nested value with isClickableValue', async () => {
    const { loader } = await setupTest({
      depth: -1,
      enableClickableValues: true,
      isClickableValue: (segment) => segment.key === 'target',
      json: { level1: { level2: { target: 'hello' } } },
    });

    const handlerSpy = vi.spyOn(
      NgxJsonTreeviewComponent.prototype as any,
      'onValueClickHandler'
    );

    const targetNode = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'target' })
    );
    await targetNode.clickValue();

    expect(handlerSpy).toHaveBeenCalledTimes(1);
    handlerSpy.mockRestore();
  });
});
