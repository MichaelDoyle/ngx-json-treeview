import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';

export interface NgxJsonTreeviewNodeHarnessFilters extends BaseHarnessFilters {
  key?: string | RegExp;
  value?: string | RegExp;
  type?: string | RegExp;
  expanded?: boolean;
}

export class NgxJsonTreeviewNodeHarness extends ComponentHarness {
  static hostSelector = '.segment';

  /**
   * Gets a `HarnessPredicate` that can be used to search for a
   * `NgxJsonTreeviewNodeHarness` that meets certain criteria.
   * @param options Options for filtering which node instances are considered a
   * match.
   * @return a `HarnessPredicate` configured with the given options.
   */
  static with(
    options: NgxJsonTreeviewNodeHarnessFilters = {}
  ): HarnessPredicate<NgxJsonTreeviewNodeHarness> {
    return new HarnessPredicate(NgxJsonTreeviewNodeHarness, options)
      .addOption('key', options.key, (harness, key) =>
        HarnessPredicate.stringMatches(harness.getKey(), key)
      )
      .addOption('value', options.value, (harness, value) =>
        HarnessPredicate.stringMatches(harness.getValue(), value)
      )
      .addOption('type', options.type, (harness, type) =>
        HarnessPredicate.stringMatches(harness.getType(), type)
      )
      .addOption('expanded', options.expanded, async (harness, expanded) => {
        const isExpanded = await harness.isExpanded();
        return isExpanded === expanded;
      });
  }

  protected toggleButton = this.locatorFor('.segment-main > button');
  protected keyElement = this.locatorForOptional(
    '.segment-main > button .segment-key, .segment-main > button .segment-label'
  );
  protected valueElement = this.locatorForOptional(
    '.segment-main > .segment-value'
  );

  /** Gets the key of the node. */
  async getKey(): Promise<string> {
    const keyEl = await this.keyElement();
    if (!keyEl) {
      // Fallback to button text if the key or label elements are not found.
      const button = await this.toggleButton();
      const text = await button.text();
      return text.trim();
    }
    let text = await keyEl.text();
    // Remove quotes if present (for objects)
    if (text.startsWith('"') && text.endsWith('"')) {
      text = text.slice(1, -1);
    }
    return text;
  }

  /** Gets the value description of the node. */
  async getValue(): Promise<string> {
    const valueEl = await this.valueElement();
    if (!valueEl) {
      return '';
    }
    const text = await valueEl.text();
    return text.trim();
  }

  /** Gets the type of the node. */
  async getType(): Promise<string | null> {
    const host = await this.host();
    const classes = await host.getAttribute('class');
    if (!classes) {
      return null;
    }
    const match = classes.match(/segment-type-([a-zA-Z]+)/);
    return match ? match[1] : null;
  }

  /** Whether the node is expanded. */
  async isExpanded(): Promise<boolean> {
    const button = await this.toggleButton();
    const classes = await button.getAttribute('class');
    return classes?.includes('expanded') ?? false;
  }

  /** Whether the node is expandable. */
  async isExpandable(): Promise<boolean> {
    const button = await this.toggleButton();
    const classes = await button.getAttribute('class');
    return classes?.includes('expandable') ?? false;
  }

  /** Expands the node if it is collapsed. */
  async expand(): Promise<void> {
    const isExpanded = await this.isExpanded();
    if (!isExpanded) {
      const button = await this.toggleButton();
      await button.click();
    }
  }

  /** Collapses the node if it is expanded. */
  async collapse(): Promise<void> {
    const isExpanded = await this.isExpanded();
    if (isExpanded) {
      const button = await this.toggleButton();
      await button.click();
    }
  }

  /** Toggles the node. */
  async toggle(): Promise<void> {
    const button = await this.toggleButton();
    await button.click();
  }

  /** Gets the child treeview harness, if expanded. */
  async getChildTree(): Promise<NgxJsonTreeviewHarness | null> {
    const isExpanded = await this.isExpanded();
    if (!isExpanded) {
      return null;
    }
    return this.locatorForOptional(NgxJsonTreeviewHarness)();
  }
}

export class NgxJsonTreeviewHarness extends ComponentHarness {
  static hostSelector = 'ngx-json-treeview';

  /**
   * Gets a list of nodes in this tree view level.
   * Note: This does not return nested nodes of children.
   */
  async getNodes(
    filter: NgxJsonTreeviewNodeHarnessFilters = {}
  ): Promise<NgxJsonTreeviewNodeHarness[]> {
    return this.locatorForAll(NgxJsonTreeviewNodeHarness.with(filter))();
  }

  /** Gets a single node that matches the filter. */
  async getNode(
    filter: NgxJsonTreeviewNodeHarnessFilters
  ): Promise<NgxJsonTreeviewNodeHarness> {
    return this.locatorFor(NgxJsonTreeviewNodeHarness.with(filter))();
  }
}
