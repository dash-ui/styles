import Stylis from "@dash-ui/stylis";
import type { Context, Plugable, Plugin } from "@dash-ui/stylis";
import { noop } from "./utils";

/**
 * Dash is a tiny, performant CSS-in-JS style rule sheet manager similar to Emotion.
 *
 * @param options - Configuration options
 */
export function createDash(options: CreateDashOptions = {}): Dash {
  let {
    key = "ui",
    nonce,
    stylisPlugins,
    prefix = true,
    batchInserts,
    speedy,
    container = typeof document !== "undefined" ? document.head : void 0,
  } = options;
  const stylis = new Stylis({ prefix });
  const inserted: Dash["inserted"] = new Set<string>();
  const cache: Dash["cache"] = new Map();
  const sheetsCache = new Map<string, DashSheet>();
  const sheet = styleSheet({
    key,
    container,
    nonce,
    speedy,
    batchInserts,
  });

  if (typeof document !== "undefined") {
    let nodes = document.querySelectorAll('style[data-cache="' + key + '"]');
    let i = 0;
    let attr;
    let node;
    const insert = inserted.add.bind(inserted);

    for (; i < nodes.length; i++) {
      /* istanbul ignore next */
      if ((attr = (node = nodes[i]).getAttribute(`data-dash`)) === null)
        continue;
      attr.split(" ").forEach(insert);

      container && node.parentNode !== container && container.appendChild(node);
    }

    stylis.use(stylisPlugins)(ruleSheet as Plugin);
  }

  /* istanbul ignore next */
  if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    const commentStart = /\/\*/g;
    const commentEnd = /\*\//g;

    stylis.use((context, content) => {
      if (context === -1) {
        while (commentStart.test(content)) {
          commentEnd.lastIndex = commentStart.lastIndex;

          /* istanbul ignore next */
          if (commentEnd.test(content)) {
            commentStart.lastIndex = commentEnd.lastIndex;
            continue;
          }

          throw new Error(
            'Your styles have an unterminated comment ("/*" without ' +
              'corresponding "*/").'
          );
        }

        commentStart.lastIndex = 0;
      }
    });
  }

  let insert: Dash["insert"] = function (key, selector, styles, styleSheet) {
    if (inserted.has(key)) return;
    inserted.add(key);
    Sheet.x = styleSheet === void 0 ? sheet : styleSheet;
    stylis(selector, styles);
  };

  if (typeof document === "undefined") {
    insert = function (key, selector, styles, styleSheet) {
      if (inserted.has(key)) return;
      inserted.add(key);
      Sheet.x = styleSheet === void 0 ? sheet : styleSheet;
      cache.set(key, stylis(selector, styles));
    };
  }

  return {
    key,
    sheet,
    sheets: {
      add(name) {
        const sheetRef = sheetsCache.get(name) || {
          n: 0,
          s: styleSheet(sheet),
        };
        sheetsCache.set(name, sheetRef);
        sheetRef.n++;
        return sheetRef.s;
      },
      delete(name) {
        const sheetRef = sheetsCache.get(name);
        if (!sheetRef) return -1;
        if (sheetRef.n === 1) {
          sheetsCache.delete(name);
          sheetRef.s.flush();
        }
        return --sheetRef.n;
      },
      keys: sheetsCache.keys.bind(sheetsCache),
    },
    stylis,
    insert,
    inserted,
    cache,
  };
}

export interface CreateDashOptions {
  /**
   * Keys in sheets used to associate `<style>` tags with this
   * specific `dash` instances via the `dash-cache` property.
   *
   * @default "ui"
   */
  readonly key?: string;
  /**
   * For security policies. A nonce is an arbitrary number that can be used just
   * once in a cryptographic communication.
   */
  readonly nonce?: string;
  /**
   * An array of stylis plugins
   * See: https://www.npmjs.com/package/stylis
   */
  readonly stylisPlugins?: Plugable[];
  /**
   * Turns on/off vendor prefixing. When a boolean, all prefixes will be
   * turned on/off. Use a function to define your own prefixes for a given key/value.
   *
   * @default true
   */
  readonly prefix?:
    | boolean
    | ((key: string, value: any, context: any) => boolean);
  /**
   * This is the container that `<style>` tags will be injected into
   * when style rules are inserted.
   *
   * @default document.head
   */
  readonly container?: HTMLElement;
  /**
   * Batch `insertRule` calls to improve performance by reducing the number of
   * style recalculations.
   */
  readonly batchInserts?: boolean;
  /**
   * Does nothing now.
   *
   * @deprecated
   */
  readonly speedy?: boolean;
}

export type Dash = {
  /**
   * The sheet key
   */
  readonly key: string;
  /**
   * The default style sheet used by this instance of Dash
   */
  readonly sheet: DashStyleSheet;
  /**
   * Used for tracking external sheets. You can safely add/delete new
   * custom sheets using this. Those sheets can be used in the `insert()`
   * method. The primary reason you'd want to use this is so that you can
   * create independently flushable styles/sheets.
   */
  readonly sheets: DashSheets;
  /**
   * The instance of Stylis used by this Dash instance
   */
  readonly stylis: Stylis;
  /**
   * A cache of Stylis rules saved by their keys. This is only used
   * on the server for generating CSS files and strings from the keys
   * used in the cache.
   */
  readonly cache: Map<string, string>;
  /**
   * A function for inserting style rules into the document and cache.
   *
   * @param key - The unique key of the rule. This is used for caching.
   * @param selector - The CSS selector to insert the rule under. Omit this
   *   when inserting a global style.
   * @param styles - The rules string you'd like to insert into the document or cache.
   * @param styleSheet - The style sheet to insert a rule into, for example `dash.sheet`.
   */
  insert(
    key: string,
    selector: string,
    styles: string,
    styleSheet?: DashStyleSheet
  ): void;
  /**
   * An insertion cache. This tracks which keys have already been inserted into
   * the DOM to prevent duplicates.
   */
  readonly inserted: Set<string>;
};

/**
 * A stylesheet cache that tracks references to the keys in it.
 * When there are no more references to a sheet, it will be flushed
 * from the DOM.
 */
export interface DashSheets {
  /**
   * Creates a new stylesheet if it doesn't exist and returns it.
   *
   * @param key - The unique key of the style sheet
   */
  add(key: string): DashStyleSheet;
  /**
   * Deletes the stylesheet from the sheets cache and flushes the
   * `<style>` tag from the DOM if this is is the last reference to
   * the key.
   *
   * @param key - The key to the sheet
   */
  delete(key: string): number;
  /**
   * Returns an iterator containing all of the keys in the cache.
   */
  keys(): ReturnType<Map<string, DashSheet>["keys"]>;
}

interface DashSheet {
  /**
   * The number of references to the sheet
   */
  n: number;
  /**
   * A dash style sheet.
   */
  s: DashStyleSheet;
}

//
// Stylesheet
export function styleSheet(options: DashStyleSheetOptions): DashStyleSheet {
  // Based off emotion and glamor's StyleSheet
  const { key, container, nonce, batchInserts, speedy } = options;
  let tag: HTMLStyleElement | null = null;
  let sheet: CSSStyleSheet | null = null;
  let supportsConstructableStylesheets = false;

  if (typeof document !== "undefined") {
    supportsConstructableStylesheets =
      "CSSStyleSheet" in window &&
      "replace" in CSSStyleSheet.prototype &&
      "adoptedStyleSheets" in Document.prototype;

    if (!supportsConstructableStylesheets) {
      tag = document.createElement("style");
      tag.setAttribute(`data-dash`, key);

      if (nonce) {
        tag.setAttribute("nonce", nonce);
      }

      container?.appendChild(tag);
      sheet = tag.sheet;

      /* istanbul ignore next */
      if (!sheet) {
        // this weirdness brought to you by firefox
        const { styleSheets } = document;
        for (let i = 0; i < styleSheets.length; i++)
          if (styleSheets[i].ownerNode === tag) {
            sheet = styleSheets[i];
            break;
          }
      }
    } else {
      sheet = new CSSStyleSheet();
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    }
  }

  return {
    key,
    nonce,
    container,
    speedy,
    insert(rule) {
      /* istanbul ignore next */
      const insertRule = (): void => {
        try {
          // this is the ultrafast version, works across browsers
          // the big drawback is that the css won't be editable in devtools
          sheet!.insertRule(rule, sheet!.cssRules.length);
        } catch (e) {
          if (
            typeof process !== "undefined" &&
            process.env.NODE_ENV !== "production"
          ) {
            console.warn(
              'There was a problem inserting the following rule: "' +
                rule +
                '"',
              e
            );
          }
        }
      };

      if (batchInserts) {
        tasks.push(insertRule);
        scheduleFlush();
      } else {
        insertRule();
      }
    },
    flush() {
      if (tag && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      } else if (supportsConstructableStylesheets) {
        document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
          (s) => s !== sheet
        );
      }
    },
  };
}

let scheduled = false;
const tasks: Task[] = [];

function scheduleFlush(): void {
  if (!scheduled) {
    scheduled = true;

    requestAnimationFrame(() => {
      let task: Task | undefined;
      while ((task = tasks.shift())) task();
      scheduled = false;

      if (tasks.length) {
        scheduleFlush();
      }
    });
  }
}

type Task = () => void;

export interface DashStyleSheetOptions {
  /**
   * Keys in sheets used to associate style sheets with
   * specific `dash` instances
   */
  readonly key: string;
  /**
   * The element to insert `<style>` tags into. For example,
   * `document.head`.
   */
  readonly container?: HTMLElement;
  /**
   * For security policies. A nonce is an arbitrary number that can be used just
   * once in a cryptographic communication.
   */
  readonly nonce?: string;
  /**
   * Batch `insertRule` calls to improve performance by reducing the number of
   * style recalculations.
   */
  readonly batchInserts?: boolean;
  /**
   * Does nothing now.
   *
   * @deprecated
   */
  readonly speedy?: boolean;
}

export interface DashStyleSheet {
  /**
   * The sheet key
   */
  readonly key: string;
  /**
   * The sheet nonce
   */
  readonly nonce?: string;
  /**
   * The sheet container
   */
  readonly container?: HTMLElement;
  /**
   * Does nothing now.
   *
   * @deprecated
   */
  readonly speedy?: boolean;
  /**
   * Inserts a style rule into your sheet
   *
   * @param rule - A style rule to insert into the sheet
   */
  insert(rule: string): void;
  /**
   * Removes all style rules from the sheet.
   */
  flush(): void;
}

//
// Stylis plugins
const RULE_DELIMITER = "/*|*/";
const RULE_NEEDLE = RULE_DELIMITER + "}";

function ruleSheet(
  // https://github.com/thysultan/stylis.js/tree/master/plugins/rule-sheet
  context: Context,
  content: any,
  selectors: string[],
  parents: string[],
  line: number,
  column: number,
  length: number,
  ns: number,
  depth: number,
  at: number
): string | undefined {
  // selector
  if (context === 2) {
    if (ns === 0) return content + RULE_DELIMITER;
  }
  // at-rule
  else if (context === 3) {
    // @font-face, @page
    if (ns === 102 || ns === 112) {
      Sheet.x.insert(selectors[0] + content);
      return "";
    } else {
      /* istanbul ignore next */
      return content + (at === 0 ? RULE_DELIMITER : "");
    }
  } else if (context === -2) {
    content.split(RULE_NEEDLE).forEach((block: string) => {
      block && Sheet.x.insert(block + "}");
    });
  }
}

const Sheet: {
  x: {
    insert(rule: string): void;
  };
} = {
  x: {
    insert: noop,
  },
};
