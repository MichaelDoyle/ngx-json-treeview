import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { type IsClickableValueFn, type Segment } from '../types';
import { NgxJsonTreeviewComponent } from './ngx-json-treeview.component';
import {
  NgxJsonTreeviewHarness,
  NgxJsonTreeviewNodeHarness,
  TestKey,
} from './testing/ngx-json-treeview.harness';

async function setupTest(
  options: {
    activePath?: string;
    depth?: number;
    enableClickableValues?: boolean;
    isClickableValue?: IsClickableValueFn;
    json?: any;
    maxPreviewLength?: number;
  } = {}
) {
  await TestBed.configureTestingModule({
    imports: [NgxJsonTreeviewComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(NgxJsonTreeviewComponent);
  fixture.componentRef.setInput('depth', options.depth ?? 0);
  fixture.componentRef.setInput('json', 'json' in options ? options.json : {});
  fixture.componentRef.setInput(
    'enableClickableValues',
    options.enableClickableValues ?? false
  );
  if (options.isClickableValue !== undefined) {
    fixture.componentRef.setInput('isClickableValue', options.isClickableValue);
  }
  if (options.maxPreviewLength !== undefined) {
    fixture.componentRef.setInput('maxPreviewLength', options.maxPreviewLength);
  }
  if (options.activePath !== undefined) {
    fixture.componentRef.setInput('_treeState', {
      activePath: signal(options.activePath),
    });
  }
  await fixture.whenStable();

  if (options.activePath !== undefined) {
    const activeEl = fixture.nativeElement.querySelector(
      `[data-path="${options.activePath}"]`
    );
    activeEl?.focus();
  }

  const component = fixture.componentInstance;
  const loader = TestbedHarnessEnvironment.loader(fixture);

  return { component, fixture, loader };
}

describe('NgxJsonTreeviewComponent', () => {
  it('should create', async () => {
    const { component } = await setupTest();
    expect(component).toBeTruthy();
  });

  it('should reset user-collapsed segments when depth changes', async () => {
    const { component, fixture, loader } = await setupTest({
      depth: 2,
      json: { nested: { deep: { inner: 1 } } },
    });

    // Seed state with a user-collapsed segment override
    (component as any).expandedSegments.set(new Map([['nested.deep', false]]));

    fixture.componentRef.setInput('depth', 3);
    await fixture.whenStable();

    const deepNode = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'deep' })
    );
    expect(await deepNode.isExpanded()).toBe(true);
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
    expect(value).toHaveLength(80);
    expect(value.endsWith('…')).toBe(true);
  });

  it('should respect custom maxPreviewLength input and propagate to children', async () => {
    const largeObj: Record<string, string> = {};
    for (let i = 0; i < 20; i++) {
      largeObj[`key_${i}`] = `val_${i}`;
    }
    const { loader } = await setupTest({
      depth: 1,
      json: { outer: { inner: largeObj } },
      maxPreviewLength: 30,
    });

    const node = await loader.getHarness(
      NgxJsonTreeviewNodeHarness.with({ key: 'inner' })
    );
    const value = await node.getValue();
    expect(value).toHaveLength(30);
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
      const { loader } = await setupTest({ depth: -1, json });

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

  describe('root values without segments', () => {
    it('should render a root undefined as "undefined"', async () => {
      const { fixture } = await setupTest({ json: undefined });

      const button = fixture.nativeElement.querySelector(
        'button.segment-primitive'
      );
      expect(button.textContent.trim()).toBe('undefined');
    });

    it('should render a root function as its source', async () => {
      const fn = (x: number) => x + 1;
      const { fixture } = await setupTest({ json: fn });

      const button = fixture.nativeElement.querySelector(
        'button.segment-primitive'
      );
      expect(button.textContent.trim()).toBe(String(fn));
    });

    for (const [json, shown] of [
      [{}, '{}'],
      [[], '[]'],
    ] as const) {
      it(`should render a root ${shown} as punctuation, not a primitive`, async () => {
        const { fixture } = await setupTest({ json });

        const el: HTMLElement = fixture.nativeElement;
        expect(el.querySelector('button.segment-primitive')).toBeNull();
        const punctuation = el.querySelector('section > .punctuation');
        expect(punctuation?.textContent).toBe(shown);
      });
    }

    it('should still render a root Date as a primitive', async () => {
      const { fixture } = await setupTest({
        json: new Date('2026-10-21T00:00:00.000Z'),
      });

      const button = fixture.nativeElement.querySelector(
        'button.segment-primitive'
      );
      expect(button.textContent.trim()).toBe('"2026-10-21T00:00:00.000Z"');
    });

    it('should render a root bigint as its formatted value with n suffix', async () => {
      const { fixture } = await setupTest({ json: 1234567890123456789n });

      const container = fixture.nativeElement.querySelector(
        '.segment-type-bigint'
      );
      expect(container).not.toBeNull();
      const button = container.querySelector('button.segment-primitive');
      expect(button.textContent.trim()).toBe('1234567890123456789n');
    });

    it('should render a root symbol as its string representation', async () => {
      const { fixture } = await setupTest({ json: Symbol('rootSymbol') });

      const container = fixture.nativeElement.querySelector(
        '.segment-type-symbol'
      );
      expect(container).not.toBeNull();
      const button = container.querySelector('button.segment-primitive');
      expect(button.textContent.trim()).toBe('Symbol(rootSymbol)');
    });

    it('should render a root RegExp as its pattern string', async () => {
      const { fixture } = await setupTest({ json: /^[a-z]+$/i });

      const container = fixture.nativeElement.querySelector(
        '.segment-type-regexp'
      );
      expect(container).not.toBeNull();
      const button = container.querySelector('button.segment-primitive');
      expect(button.textContent.trim()).toBe('/^[a-z]+$/i');
    });

    it('should render a root Error with its properties as an expandable object', async () => {
      const { loader } = await setupTest({
        json: new Error('fatal connection error'),
      });

      const messageNode = await loader.getHarness(
        NgxJsonTreeviewNodeHarness.with({ key: 'message' })
      );
      expect(await messageNode.getValue()).toBe('"fatal connection error"');
    });

    it('should render a root Map with entries as an expandable object', async () => {
      const map = new Map([
        ['keyA', 1],
        ['keyB', 2],
      ]);
      const { loader } = await setupTest({ json: map });

      const nodeA = await loader.getHarness(
        NgxJsonTreeviewNodeHarness.with({ key: 'keyA' })
      );
      expect(await nodeA.getValue()).toBe('1');
    });

    it('should render a root empty Map as Map(0) {}', async () => {
      const { fixture } = await setupTest({ json: new Map() });

      const container =
        fixture.nativeElement.querySelector('.segment-type-map');
      expect(container).not.toBeNull();
      const button = container.querySelector('button.segment-primitive');
      expect(button.textContent.trim()).toBe('Map(0) {}');
    });

    it('should render a root Set with values as an ordered array', async () => {
      const set = new Set(['x', 'y']);
      const { loader } = await setupTest({ json: set });

      const node0 = await loader.getHarness(
        NgxJsonTreeviewNodeHarness.with({ key: '0' })
      );
      expect(await node0.getValue()).toBe('"x"');
    });

    it('should render a root empty Set as Set(0) []', async () => {
      const { fixture } = await setupTest({ json: new Set() });

      const container =
        fixture.nativeElement.querySelector('.segment-type-set');
      expect(container).not.toBeNull();
      const button = container.querySelector('button.segment-primitive');
      expect(button.textContent.trim()).toBe('Set(0) []');
    });
  });

  describe('additional JS value types within objects', () => {
    describe('bigint', () => {
      it('should classify and format a bigint value with n suffix', async () => {
        const { loader } = await setupTest({
          depth: 1,
          json: { val: 9007199254740993n },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('bigint');
        expect(await node.getValue()).toBe('9007199254740993n');
      });

      it('should not log an error when parsing a bigint value', async () => {
        const errorSpy = vi.spyOn(console, 'error');

        await setupTest({
          depth: 1,
          json: { val: 123n },
        });

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
      });
    });

    describe('symbol', () => {
      it('should classify and format a symbol value', async () => {
        const { loader } = await setupTest({
          depth: 1,
          json: { val: Symbol('mySymbol') },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('symbol');
        expect(await node.getValue()).toBe('Symbol(mySymbol)');
      });

      it('should not log an error when parsing a symbol value', async () => {
        const errorSpy = vi.spyOn(console, 'error');

        await setupTest({
          depth: 1,
          json: { val: Symbol('test') },
        });

        expect(errorSpy).not.toHaveBeenCalled();
        errorSpy.mockRestore();
      });
    });

    describe('RegExp', () => {
      it('should classify and format a RegExp value', async () => {
        const { loader } = await setupTest({
          depth: 1,
          json: { val: /foo\d+/gi },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('regexp');
        expect(await node.getValue()).toBe('/foo\\d+/gi');
      });
    });

    describe('Error', () => {
      it('should classify and format a collapsed Error with its message', async () => {
        const { loader } = await setupTest({
          depth: 0,
          json: { val: new Error('something went wrong') },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('error');
        expect(await node.getValue()).toBe('Error: something went wrong');
        expect(await node.isExpandable()).toBe(true);
      });

      it('should format a collapsed Error with segment-label styling', async () => {
        const { fixture } = await setupTest({
          depth: 0,
          json: { val: new Error('something went wrong') },
        });

        const button = fixture.nativeElement.querySelector(
          '.segment-type-error button.segment-label'
        );
        expect(button).not.toBeNull();
      });

      it('should expand Error properties including name, message, and custom properties', async () => {
        const sampleError = new Error('something went wrong');
        (sampleError as unknown as Record<string, unknown>)['code'] =
          'ERR_TEST';

        const { loader } = await setupTest({
          depth: 1,
          json: { val: sampleError },
        });

        const nameNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'name' })
        );
        expect(await nameNode.getValue()).toBe('"Error"');

        const messageNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'message' })
        );
        expect(await messageNode.getValue()).toBe('"something went wrong"');

        const codeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'code' })
        );
        expect(await codeNode.getValue()).toBe('"ERR_TEST"');
      });

      it('should expand Error cause when present', async () => {
        const sampleError = new Error('outer error', {
          cause: new Error('inner cause'),
        });

        const { loader } = await setupTest({
          depth: 1,
          json: { val: sampleError },
        });

        const causeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'cause' })
        );
        expect(await causeNode.getType()).toBe('error');
        expect(await causeNode.getValue()).toBe('Error: inner cause');
        expect(await causeNode.isExpandable()).toBe(true);
      });
    });

    describe('Map', () => {
      it('should classify and format a collapsed Map with entries', async () => {
        const { loader } = await setupTest({
          depth: 0,
          json: { val: new Map([['alpha', 10]]) },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('map');
        expect(await node.getValue()).toBe('Map(1) {"alpha" => 10}');
        expect(await node.isExpandable()).toBe(true);
      });

      it('should expand Map entries as key-value pairs', async () => {
        const { loader } = await setupTest({
          depth: 1,
          json: { val: new Map([['alpha', 10]]) },
        });

        const childNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'alpha' })
        );
        expect(await childNode.getValue()).toBe('10');
      });

      it('should format an empty Map as Map(0) {} with segment-label styling', async () => {
        const { fixture, loader } = await setupTest({
          depth: 1,
          json: { val: new Map() },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('map');
        expect(await node.getValue()).toBe('Map(0) {}');
        expect(await node.isExpandable()).toBe(false);

        const button = fixture.nativeElement.querySelector(
          '.segment-type-map button.segment-label'
        );
        expect(button).not.toBeNull();
      });

      it('should render Map with colliding stringified keys without tracking errors', async () => {
        const collidingMap = new Map<unknown, unknown>([
          ['1', 'stringOne'],
          [1, 'numericOne'],
          [{ id: 1 }, 'objOne'],
          [{ id: 2 }, 'objTwo'],
        ]);

        const { loader } = await setupTest({
          depth: 1,
          json: { val: collidingMap },
        });

        const nodes = await loader.getAllHarnesses(NgxJsonTreeviewNodeHarness);
        expect(nodes.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Set', () => {
      it('should classify and format a collapsed Set with values', async () => {
        const { loader } = await setupTest({
          depth: 0,
          json: { val: new Set([100, 200]) },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('set');
        expect(await node.getValue()).toBe('Set(2) [100,200]');
        expect(await node.isExpandable()).toBe(true);
      });

      it('should expand Set values as ordered array elements', async () => {
        const { loader } = await setupTest({
          depth: 1,
          json: { val: new Set(['apple', 'banana']) },
        });

        const item0 = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: '0' })
        );
        expect(await item0.getValue()).toBe('"apple"');

        const item1 = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: '1' })
        );
        expect(await item1.getValue()).toBe('"banana"');
      });

      it('should format an empty Set as Set(0) [] with segment-label styling', async () => {
        const { fixture, loader } = await setupTest({
          depth: 1,
          json: { val: new Set() },
        });

        const node = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'val' })
        );
        expect(await node.getType()).toBe('set');
        expect(await node.getValue()).toBe('Set(0) []');
        expect(await node.isExpandable()).toBe(false);

        const button = fixture.nativeElement.querySelector(
          '.segment-type-set button.segment-label'
        );
        expect(button).not.toBeNull();
      });
    });
  });

  describe('keyboard navigation (WAI-ARIA tree pattern)', () => {
    const sampleTree = {
      user: {
        profile: {
          name: 'Alice',
        },
        settings: {
          theme: 'dark',
        },
      },
      active: true,
      count: 42,
    };

    describe('roving tabindex initialization', () => {
      it('should set tabindex="0" on the first visible node', async () => {
        const { loader } = await setupTest({
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );

        expect(await userNode.getTabIndex()).toBe('0');
      });

      it('should set tabindex="-1" on non-first visible nodes', async () => {
        const { loader } = await setupTest({
          depth: 0,
          json: sampleTree,
        });

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        const countNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'count' })
        );

        expect(await activeNode.getTabIndex()).toBe('-1');
        expect(await countNode.getTabIndex()).toBe('-1');
      });
    });

    describe('aria-labelledby accessible name computation', () => {
      it('should reference only the key label for expandable nodes', async () => {
        const { fixture, loader } = await setupTest({
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        const labelledBy = await userNode.getAriaLabelledBy();
        expect(labelledBy).toBeTruthy();
        expect(labelledBy).not.toContain(' ');
        expect(labelledBy).toContain('-node-label-');

        const labelEl = fixture.nativeElement.querySelector(`#${labelledBy}`);
        expect(labelEl).not.toBeNull();
        expect(labelEl.textContent.trim()).toBe('"user"');
      });

      it('should reference both the key label and value for leaf nodes', async () => {
        const { fixture, loader } = await setupTest({
          depth: 0,
          json: sampleTree,
        });

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        const labelledBy = await activeNode.getAriaLabelledBy();
        expect(labelledBy).toBeTruthy();

        const ids = labelledBy!.split(' ');
        expect(ids).toHaveLength(2);
        expect(ids[0]).toContain('-node-label-');
        expect(ids[1]).toContain('-node-val-');

        const keyEl = fixture.nativeElement.querySelector(`#${ids[0]}`);
        const valEl = fixture.nativeElement.querySelector(`#${ids[1]}`);
        expect(keyEl).not.toBeNull();
        expect(valEl).not.toBeNull();
        expect(keyEl.textContent.trim()).toBe('"active"');
        expect(valEl.textContent.trim()).toBe('true');
      });

      it('should reference both key and value for empty containers', async () => {
        const { fixture, loader } = await setupTest({
          depth: 0,
          json: { emptyList: [] },
        });

        const emptyNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'emptyList' })
        );
        const labelledBy = await emptyNode.getAriaLabelledBy();
        expect(labelledBy).toBeTruthy();

        const ids = labelledBy!.split(' ');
        expect(ids).toHaveLength(2);

        const keyEl = fixture.nativeElement.querySelector(`#${ids[0]}`);
        const valEl = fixture.nativeElement.querySelector(`#${ids[1]}`);
        expect(keyEl).not.toBeNull();
        expect(valEl).not.toBeNull();
        expect(keyEl.textContent.trim()).toBe('"emptyList"');
        expect(valEl.textContent.trim()).toBe('[]');
      });
    });

    describe('ArrowDown navigation', () => {
      it('should move focus to the next visible node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.DOWN_ARROW);
        await fixture.whenStable();

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        expect(await activeNode.isFocused()).toBe(true);
      });

      it('should keep focus on the last node when pressed on the last visible node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'count',
          depth: 0,
          json: sampleTree,
        });

        const countNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'count' })
        );
        await countNode.sendKeys(TestKey.DOWN_ARROW);
        await fixture.whenStable();

        expect(await countNode.isFocused()).toBe(true);
      });
    });

    describe('ArrowUp navigation', () => {
      it('should move focus to the previous visible node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'active',
          depth: 0,
          json: sampleTree,
        });

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        await activeNode.sendKeys(TestKey.UP_ARROW);
        await fixture.whenStable();

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        expect(await userNode.isFocused()).toBe(true);
      });

      it('should keep focus on the first node when pressed on the first visible node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.UP_ARROW);
        await fixture.whenStable();

        expect(await userNode.isFocused()).toBe(true);
      });
    });

    describe('ArrowRight navigation', () => {
      it('should expand a closed node without moving focus', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.RIGHT_ARROW);
        await fixture.whenStable();

        expect(await userNode.isExpanded()).toBe(true);
      });

      it('should move focus to the first child node when pressed on an open node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 1,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.RIGHT_ARROW);
        await fixture.whenStable();

        const profileNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'profile' })
        );
        expect(await profileNode.isFocused()).toBe(true);
      });

      it('should do nothing when pressed on a leaf node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'active',
          depth: 0,
          json: sampleTree,
        });

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        await activeNode.sendKeys(TestKey.RIGHT_ARROW);
        await fixture.whenStable();

        expect(await activeNode.isFocused()).toBe(true);
      });
    });

    describe('ArrowLeft navigation', () => {
      it('should collapse an open node without moving focus', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 1,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.LEFT_ARROW);
        await fixture.whenStable();

        expect(await userNode.isExpanded()).toBe(false);
      });

      it('should move focus to the parent node when pressed on a child node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user.profile',
          depth: 1,
          json: sampleTree,
        });

        const profileNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'profile' })
        );
        await profileNode.sendKeys(TestKey.LEFT_ARROW);
        await fixture.whenStable();

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        expect(await userNode.isFocused()).toBe(true);
      });

      it('should do nothing when pressed on a root-level closed node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.LEFT_ARROW);
        await fixture.whenStable();

        expect(await userNode.isFocused()).toBe(true);
      });
    });

    describe('Home and End navigation', () => {
      it('should move focus to the first visible node when Home is pressed', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'count',
          depth: 0,
          json: sampleTree,
        });

        const countNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'count' })
        );
        await countNode.sendKeys(TestKey.HOME);
        await fixture.whenStable();

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        expect(await userNode.isFocused()).toBe(true);
      });

      it('should move focus to the last visible node when End is pressed', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.END);
        await fixture.whenStable();

        const countNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'count' })
        );
        expect(await countNode.isFocused()).toBe(true);
      });
    });

    describe('Enter and Space activation', () => {
      it('should expand a closed node when Enter is pressed', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(TestKey.ENTER);
        await fixture.whenStable();

        expect(await userNode.isExpanded()).toBe(true);
      });

      it('should collapse an open node when Space is pressed', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 1,
          json: sampleTree,
        });

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        await userNode.sendKeys(' ');
        await fixture.whenStable();

        expect(await userNode.isExpanded()).toBe(false);
      });

      it('should trigger clickable value when Enter is pressed on a clickable leaf node', async () => {
        const { component, fixture, loader } = await setupTest({
          activePath: 'active',
          depth: 0,
          enableClickableValues: true,
          isClickableValue: (segment) => segment.key === 'active',
          json: sampleTree,
        });

        const emittedSegments: Segment[] = [];
        component.onValueClick.subscribe((segment) => {
          emittedSegments.push(segment);
        });

        const activeNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'active' })
        );
        await activeNode.sendKeys(TestKey.ENTER);
        await fixture.whenStable();

        expect(emittedSegments).toHaveLength(1);
        expect(emittedSegments[0].key).toBe('active');
      });
    });

    describe('pointer interaction synchronization', () => {
      it('should update roving tabindex to the clicked node and set -1 on previous node', async () => {
        const { fixture, loader } = await setupTest({
          activePath: 'user',
          depth: 1,
          json: sampleTree,
        });

        const settingsNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'settings' })
        );
        await settingsNode.toggle();
        await fixture.whenStable();

        const userNode = await loader.getHarness(
          NgxJsonTreeviewNodeHarness.with({ key: 'user' })
        );
        expect(await settingsNode.getTabIndex()).toBe('0');
        expect(await userNode.getTabIndex()).toBe('-1');
      });
    });

    describe('getFocusedNode search across tree depths', () => {
      it('should find focused node at top level', async () => {
        const { fixture } = await setupTest({
          activePath: 'user',
          depth: 0,
          json: sampleTree,
        });

        const treeHarness = await TestbedHarnessEnvironment.harnessForFixture(
          fixture,
          NgxJsonTreeviewHarness
        );
        const focusedNode = await treeHarness.getFocusedNode();

        expect(focusedNode).not.toBeNull();
        expect(await focusedNode!.getKey()).toBe('user');
      });

      it('should find focused node across nested descendant depths', async () => {
        const { fixture } = await setupTest({
          activePath: 'user.profile.name',
          depth: 2,
          json: sampleTree,
        });

        const treeHarness = await TestbedHarnessEnvironment.harnessForFixture(
          fixture,
          NgxJsonTreeviewHarness
        );
        const focusedNode = await treeHarness.getFocusedNode();

        expect(focusedNode).not.toBeNull();
        expect(await focusedNode!.getKey()).toBe('name');
      });
    });
  });
});
