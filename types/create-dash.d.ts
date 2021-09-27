import Stylis from "@dash-ui/stylis";
import type { Plugable } from "@dash-ui/stylis";
/**
 * Dash is a tiny, performant CSS-in-JS style rule sheet manager similar to Emotion.
 *
 * @param options - Configuration options
 */
export declare function createDash(options?: CreateDashOptions): Dash;
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
    readonly prefix?: boolean | ((key: string, value: any, context: any) => boolean);
    /**
     * This is the container that `<style>` tags will be injected into
     * when style rules are inserted.
     *
     * @default document.head
     */
    readonly container?: HTMLElement;
    /**
     * Uses speedy mode for `<style>` tag insertion. It's the fastest way
     * to insert new style rules, but will make styles uneditable in some browsers.
     *
     * @default false
     */
    readonly speedy?: boolean;
}
export declare type Dash = {
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
    readonly stylis: typeof Stylis;
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
    insert(key: string, selector: string, styles: string, styleSheet?: DashStyleSheet): void;
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
export declare function styleSheet(options: DashStyleSheetOptions): DashStyleSheet;
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
     * Uses speedy mode for `<style>` tag insertion. It's the fastest way
     * to insert new style rules, but will make styles uneditable in some browsers.
     *
     * @default false
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
     * `true` if speedy mode is turned on
     */
    readonly speedy: boolean;
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
export {};
