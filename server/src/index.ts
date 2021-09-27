/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Creates a string of CSS based on the dash `inserted` cache. This
 * is an extremely fast way to generate a CSS string. It returns an
 * object containing the hash names of all of the styles used as well
 * as the CSS string.
 *
 * Note that this function is unsafe in asynchronous render environments
 * because multiple pages using the same cache will dirty the results.
 * This means it will not work with Gatsby, for example.
 *
 * @param styles - A `styles()` instance
 * @param options - Configuration options
 */
export function createStylesFromCache(
  styles = require("@dash-ui/styles").styles,
  options: CreateServerStylesOptions = {}
): ServerStylesResult {
  const { clearCache = false } = options;
  const { dash } = styles;
  const styleCache = dash.cache;
  const names = new Set([...dash.sheets.keys(), ...dash.inserted.values()]);
  let css = "";

  for (const name of names) css += styleCache.get(name);

  if (clearCache) dash.inserted.clear();
  return { names: [...names], css };
}

/**
 * Creates a `<style>` tag w/ CSS based on the dash `inserted` cache. This
 * is an extremely fast way to generate a `<style>` tag.
 *
 * Note that this function is unsafe in asynchronous render environments
 * because multiple pages using the same cache will dirty the results.
 * This means it will not work with Gatsby, for example.
 *
 * @param styles - A `styles()` instance
 * @param options - Configuration options
 */
export function createStyleTagFromCache(
  styles = require("@dash-ui/styles").styles,
  options: CreateServerStylesOptions = {}
): string {
  const { css, names } = createStylesFromCache(styles, options);
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : "";

  return `<style data-dash="${names.join(" ")}" data-cache="${
    styles.dash.key
  }"${nonceString}>${css}</style>`;
}

/**
 * Writes a CSS to a file based on the dash `inserted` cache. This
 * is an extremely fast way to generate a CSS file.
 *
 * Note that this function is unsafe in asynchronous render environments
 * because multiple pages using the same cache will dirty the results.
 * This means it will not work with Gatsby, for example.
 *
 * @param outputPath - An absolute or relative path dictating where you want to
 *  output the CSS file.
 * @param styles - A `styles()` instance
 * @param options - Configuration options
 */
export async function writeStylesFromCache(
  outputPath = "",
  styles = require("@dash-ui/styles").styles,
  options?: WriteServerStylesOptions & { clearCache?: boolean }
): Promise<WriteServerStylesResult> {
  // Requiring in here prevents webpack errors in stuff like Next.js apps
  const fs = require("fs");
  const path = require("path");
  let { name, hash = styles.hash, clearCache = false } = options || {};
  const { css, names } = createStylesFromCache(styles, { clearCache });
  name = `${name || styles.dash.key + "-" + hash(css) + ".css"}`;
  const filename = path.join(outputPath, name);
  await fs.promises.writeFile(filename, css);
  return { filename, name, path: outputPath, css, names };
}

/**
 * Creates a string of CSS based on an HTML string. This function will
 * parse your HTML output for Dash class names and pull the styles associated
 * with them from the Dash cache. It returns an object containing the hash names
 * of all of the styles used as well as the CSS string.
 *
 * This is a safe way to generate style strings in an asynchronous environment
 *
 * @param html - An HTML string
 * @param styles - A `styles()` instance
 */
export function createStylesFromString(
  html: string,
  styles = require("@dash-ui/styles").styles
): ServerStylesResult {
  const { dash } = styles;
  const styleCache = dash.cache;
  const names = new Set<string>(dash.sheets.keys());

  let css = "";
  for (let name of names) css += styleCache.get(name);

  const re = new RegExp(`["\\s'=]${dash.key}-(\\w+)`, "g");
  for (const [, name] of html.matchAll(re)) {
    if (!names.has(name)) {
      css += styleCache.get(name) || "";
      names.add(name);
    }
  }

  return { names: [...names], css };
}

/**
 * Creates a `<style>` tag w/ CSS based on an HTML string. This function will
 * parse your HTML output for Dash class names and pull the styles associated
 * with them from the Dash cache.
 *
 * This is a safe way to generate `<style>` tags in an asynchronous environment.
 *
 * @param html - An HTML string
 * @param styles - A `styles()` instance
 */
export function createStyleTagFromString(
  html: string,
  styles = require("@dash-ui/styles").styles
): string {
  const { css, names } = createStylesFromString(html, styles);
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : "";

  return `<style data-dash="${names.join(" ")}" data-cache="${
    styles.dash.key
  }"${nonceString}>${css}</style>`;
}

/**
 * Writes a CSS to a file based on an HTML string. This function will
 * parse your HTML output for Dash class names and pull the styles associated
 * with them from the Dash cache.
 *
 * This is a safe way to generate `<style>` tags in an asynchronous environment.
 *
 * @param html
 * @param styles - A `styles()` instance
 * @param outputPath - An absolute or relative path dictating where you want to
 *  output the CSS file.
 * @param options - Configuration options
 */
export async function writeStylesFromString(
  html: string,
  outputPath = "",
  styles = require("@dash-ui/styles").styles,
  options?: WriteServerStylesOptions
): Promise<WriteServerStylesResult> {
  // Requiring in here prevents webpack errors in stuff like Next.js apps
  const fs = require("fs");
  const path = require("path");
  let { name, hash = styles.hash } = options || {};
  const { css, names } = createStylesFromString(html, styles);
  name = `${name || styles.dash.key + "-" + hash(css) + ".css"}`;
  const filename = path.join(outputPath, name);
  await fs.promises.writeFile(filename, css);
  return { filename, name, path: outputPath, css, names };
}

export interface ServerStylesResult {
  /**
   * A CSS string containing all of the styles that were used
   */
  css: string;
  /**
   * Hash names of all of the styles used in the generated CSS
   */
  names: string[];
}

export interface CreateServerStylesOptions {
  /**
   * Clears the Dash `inserted` cache after styles have been
   * generated. This is useful in synchronous environments when you
   * only want to generate CSS strings for the styles that were actually
   * used in a given page/render.
   *
   * @default false
   */
  clearCache?: boolean;
}

export interface WriteServerStylesOptions {
  /**
   * Use this if you want to create your own name for the CSS file.
   * By default, this function will create a filename based on the hash
   * of the generated CSS string.
   */
  name?: string;
  /**
   * Use a custom hash function for creating the name of your CSS file.
   * By default this function will use the hash function attached to your
   * `styles()` instance.
   */
  hash?: (string: string) => string;
}

export interface WriteServerStylesResult {
  /**
   * The filename of the generated file. This is the `outputPath` joined
   * to the basename of the CSS file that was generated.
   */
  filename: string;
  /**
   * The basename of the CSS file that was generated.
   */
  name: string;
  /**
   * The output path of the CSS file excluding the basename.
   */
  path: string;
  /**
   * The CSS string that was generated and written to the output
   * file.
   */
  css: string;
  /**
   * The hash names of all of the styles that were inserted into
   * the generated CSS string.
   */
  names: string[];
}
