import crc from "crc";
import { createDash, createStyles, pathToToken, styles } from "./index";

afterEach(() => {
  styles.dash.sheet.flush();
  document.getElementsByTagName("html")[0].innerHTML = "";
});

function cssRules(
  element: any = document.querySelectorAll(`style[data-dash]`)[0]
): CSSStyleRule[] {
  return element.sheet.cssRules;
}

describe("createStyles()", () => {
  it("turns off vendor prefixing", () => {
    const myStyles = createStyles({ dash: createDash({ prefix: false }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(
      cssRules(document.querySelectorAll("style[data-dash]")[1])[0].cssText
    ).toMatch(/\{display: flex;\}/);
  });

  it("configures hash algorithm", () => {
    const customHash = (string: string): string =>
      crc.crc32(string).toString(16);
    const myStyles = createStyles({ hash: customHash });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    expect(style("flex")).toMatchSnapshot();

    const style2 = createStyles().variants({
      flex: { display: "flex" },
    });

    expect(style2("flex")).not.toBe(style("flex"));
  });

  it("adds nonce to style tags", () => {
    createStyles({
      dash: createDash({ nonce: "EDNnf03nceIOfn39fn3e9h3sdfa" }),
    });

    expect(
      document.querySelectorAll(`style[data-dash]`)[0].getAttribute("nonce")
    ).toBe("EDNnf03nceIOfn39fn3e9h3sdfa");
  });

  it('changes key to "css"', () => {
    const myStyles = createStyles({ dash: createDash({ key: "css" }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(cssRules()[0].selectorText).toStrictEqual(
      expect.stringMatching(/^\.css-/)
    );
  });

  it("changes container to document.body", () => {
    const myStyles = createStyles({
      dash: createDash({ container: document.body }),
    });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(document.querySelectorAll(`body style[data-dash]`).length).toBe(1);
  });

  it("should initialize w/ tokens", () => {
    const myStyles = createStyles({ tokens: { box: { small: 100 } } });
    const style = myStyles.variants({
      small: ({ box }) => ({
        width: box.small,
        height: box.small,
      }),
    });

    expect(style.css("small")).toMatchSnapshot();
  });

  it("should initialize w/ themes", () => {
    const myStyles = createStyles({
      tokens: {},
      themes: {
        light: {
          color: {
            primary: "white",
            secondary: "foo",
          } as const,
        },
        dark: {
          color: {
            primary: "black",
            secondary: "bar",
          } as const,
        },
      },
    });

    const style = myStyles.variants({
      primary: ({ color }) => ({ color: color.primary }),
    });

    expect(style.css("primary")).toEqual("color:var(--color-primary);");
    expect(myStyles.theme("light")).toEqual("ui-light-theme");
  });
});

describe("styles.variants()", () => {
  it("returns single class name", () => {
    const style = createStyles().variants({
      flex: { display: "flex" },
      block: { display: "block" },
      inline: "display: inline;",
    });

    expect(style("flex")).toMatchSnapshot();
    expect(style("flex", "block", "inline")).toMatchSnapshot();
    expect(style({ flex: true, block: false, inline: true })).toMatchSnapshot();
  });

  it("returns css styles", () => {
    const style = createStyles().variants({
      flex: { display: "flex" },
      block: { display: "block" },
      inline: "display: inline;",
    });

    expect(style.css("flex")).toMatchSnapshot();
    expect(style.css("flex", "block", "inline")).toMatchSnapshot();
    expect(
      style.css({ flex: true, block: false, inline: true })
    ).toMatchSnapshot();
  });

  it("works with numeric variants", () => {
    const style = createStyles().variants({
      0: { display: "flex" },
      1: { display: "block" },
      2: "display: inline;",
    });

    expect(style.css(0)).toEqual("display:flex;");
    expect(style.css(0, 1, 2)).toEqual(
      "display:flex;display:block;display: inline;"
    );
    expect(style.css({ 0: true, 1: false, 2: true })).toEqual(
      "display:flex;display: inline;"
    );
  });

  it("joins css styles and returns class name", () => {
    const style = createStyles();
    const flex = style.variants({
      flex: { display: "flex" },
    });
    const block = style.variants({
      block: { display: "block" },
    });

    style.join(flex.css("flex"), block.css("block"));
    expect(style.join(flex.css("flex"), block.css("block"))).not.toBe(
      flex("flex")
    );
    expect(cssRules()[0].cssText).not.toMatch(/display: flex;/);
    expect(cssRules()[0].cssText).toMatch(/display: block;/);
  });

  it("returns empty string when falsy", () => {
    const style = createStyles().variants({
      flex: { display: "flex" },
    });

    let name = style(false);
    expect(typeof name).toBe("string");
    expect(name.length).toBe(0);

    name = style(false, null, undefined, { flex: false });
    expect(typeof name).toBe("string");
    expect(name.length).toBe(0);
  });

  it("ignores unknown keys", () => {
    const style = createStyles().variants({
      flex: { display: "flex" },
    });
    // @ts-expect-error
    let name = style("noop");
    expect(typeof name).toBe("string");
    expect(name.length).toBe(0);
    // @ts-expect-error
    name = style({ noop: true });
    expect(typeof name).toBe("string");
    expect(name.length).toBe(0);
  });
  it("allows unitless object values", () => {
    const style = createStyles().variants({
      box: { width: 200, height: "200px" },
    });

    style("box");
    expect(cssRules()[0].cssText).toMatch(/width: 200px;/);
  });

  it("adds styles by order of definition when called", () => {
    const style = createStyles({
      dash: createDash({ prefix: false }),
    }).variants({
      inline: "display: inline;",
      flex: { display: "flex" },
      block: { display: "block" },
    });

    style("flex", "block", "inline");

    expect(cssRules()[0].cssText).not.toMatch(/display: (flex|block);/);
    expect(cssRules()[0].cssText).toMatch(/display: inline;/);
    styles.dash.inserted.clear();
    styles.dash.sheet.flush();
    style({ flex: true, block: true, inline: true });

    expect(cssRules()[0].cssText).not.toMatch(/display: (flex|block);/);
    expect(cssRules()[0].cssText).toMatch(/display: inline;/);
  });

  it("allows comments", () => {
    const style = createStyles().variants({
      flex: `
        /* this is a flex style */
        display: flex;
      `,
    });

    expect(style.css("flex")).toMatchSnapshot();
  });

  it("allows full capabilities w/ style objects", () => {
    const style = createStyles().variants({
      flex: {
        display: "flex",
        "&.foo": {
          display: "block",
        },
      },
    });

    style("flex");

    const rules = cssRules();
    expect(rules[0].cssText).toMatch(/display: flex;/);
    expect(rules[1].selectorText).toMatch(/\.foo/);
    expect(rules[1].cssText).toMatch(/display: block;/);
  });

  it("passes tokens to style callbacks", () => {
    const myStyles = createStyles({
      tokens: {
        colors: {
          bg: "#09a",
          text: "#c12",
        },
      },
      themes: {
        dark: {
          colors: {
            bg: "#000",
            text: "#fff",
          },
        },
        light: {
          colors: {
            bg: "#fff",
            text: "#000",
            lightSpecific: "#ccc",
          },
        },
      },
    });

    const style = myStyles.variants({
      box: (vars) => {
        expect(vars).toMatchSnapshot();
        return "";
      },
    });

    style("box");
    expect(myStyles.theme("dark")).toMatchSnapshot();
    style("box");
    expect(myStyles.theme("light")).toMatchSnapshot();
    style("box");
  });

  it("adds dev labels", () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const style = createStyles().variants({
      flex: `display: flex;`,
      block: `display: block;`,
      inline: `display: inline;`,
    });

    expect(style("flex")).toMatchSnapshot("-flex");
    expect(style("flex", "inline")).toMatchSnapshot("-flex-inline");
    expect(style("flex", { inline: false, block: true })).toMatchSnapshot(
      "-flex-block"
    );
    process.env.NODE_ENV = prevEnv;
  });

  it("replaces disallowed characters in dev labels", () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const style = createStyles().variants({
      "box=big": { width: 400, height: "400px" },
    });

    style("box=big");
    const rules = cssRules();
    expect(rules[0].selectorText).toMatch(/box-big/);
    process.env.NODE_ENV = prevEnv;
  });

  it("allows default styles", () => {
    const style = createStyles().variants({
      default: `display: flex;`,
      block: `display: block;`,
    });

    style();
    const rules = cssRules();
    expect(rules[0].cssText).toMatch(/display: flex;/);
  });

  it("has a default style that is always applied first", () => {
    const style = createStyles().variants({
      block: `display: block;`,
      default: `display: flex;`,
    });

    style("block");
    const rules = cssRules();
    expect(rules[0].cssText).toMatch(/display: block;/);
  });

  it("flushes sheet tags", () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      block: { display: "block" },
    });

    style("flex");
    style("block");
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    myStyles.dash.sheet.flush();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0);
  });

  it("rehydrates", () => {
    const tag = document.createElement("style");
    tag.setAttribute(`data-dash`, "1ut9bc3");
    tag.setAttribute("data-cache", "ui");
    tag.appendChild(
      document.createTextNode(
        `.-ui-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
      )
    );
    document.head.appendChild(tag);

    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
  });

  it("rehydrates into custom container", () => {
    const tag = document.createElement("style");
    tag.setAttribute(`data-dash`, "1ut9bc3");
    tag.setAttribute("data-cache", "ui");

    tag.appendChild(
      document.createTextNode(
        `.ui-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
      )
    );
    document.head.appendChild(tag);

    const myStyles = createStyles({
      dash: createDash({ container: document.body }),
    });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(document.querySelectorAll(`head style[data-dash]`).length).toBe(0);
    expect(document.querySelectorAll(`body style[data-dash]`).length).toBe(2);
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
  });
});

describe("styles.keyframes()", () => {
  it("returns keyframes name", () => {
    const name = createStyles().keyframes`
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    `;

    expect(name).toMatchSnapshot();
  });

  it("adds keyframes to dom", () => {
    const name = createStyles().keyframes(`
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    `);

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toMatch(new RegExp(`@-webkit-keyframes ${name}`));
  });

  it("works with tokens callback", () => {
    const myStyles = createStyles({
      tokens: {
        color: {
          blue: "blue",
          red: "red",
        },
      },
    });

    myStyles.keyframes(
      ({ color }) => `
      0% {
        background-color: ${color.blue};
      }
      100% {
        background-color: ${color.red};
      }
    `
    );

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(3); // tokens + kf
    const rule = cssRules(document.querySelectorAll(`style[data-dash]`)[2])[0];
    expect(rule.cssText).toMatch(/0% {background-color: var\(--color-blue\);}/);
    expect(rule.cssText).toMatch(
      /100% {background-color: var\(--color-red\);}/
    );
  });
});

describe(`styles.insertTokens()`, () => {
  it("creates tokens", () => {
    createStyles().insertTokens({
      columns: 12,
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });

    const rule = cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0];
    expect(rule.selectorText).toBe(":root");
    expect(rule.cssText).toMatch(/--system-p-md: 1rem;/);
    expect(rule.cssText).toMatch(/--colors-blue: #09a;/);
  });

  it("removes tokens when eject is called", () => {
    const myStyles = createStyles();
    const eject = myStyles.insertTokens({
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    eject();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    expect(myStyles.dash.inserted.size).toBe(0);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(0);
  });

  it("mangles tokens", () => {
    createStyles({ mangleTokens: true }).insertTokens({
      columns: 12,
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });

    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).not.toMatch(/spacing/);
  });

  it("mangles tokens w/ reserved keys", () => {
    createStyles({ mangleTokens: { "colors-blue": true } }).insertTokens({
      columns: 12,
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });

    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).not.toMatch(/spacing/);
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toMatch(/colors/);
  });

  it("still exists in caches when used more than once", () => {
    const myStyles = createStyles();
    const ejectA = myStyles.insertTokens({
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });
    const ejectB = myStyles.insertTokens({
      colors: {
        blue: "#09a",
        red: "#c12",
        lightRed: "#c1a",
      },
      spacing: {
        xs: "1rem",
      },
      system: {
        p: { md: "1rem", xs: "0.25rem", sm: "0.5rem", lg: "2rem", xl: "4rem" },
      },
    });

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    ejectA();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    ejectB();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    expect(myStyles.dash.inserted.size).toBe(0);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(0);
  });

  it("creates tokens w/ scales", () => {
    createStyles().insertTokens({
      spacing: ["1rem", "2rem", "4rem"],
    });

    const cssText = cssRules(
      document.querySelectorAll(`style[data-dash]`)[1]
    )[0].cssText;
    expect(cssText).toMatch(/--spacing-0: 1rem; --spacing-1: 2rem;/);
  });
});

describe(`styles.insertThemes()`, () => {
  it("creates tokens", () => {
    createStyles().insertThemes({
      dark: {
        colors: {
          bg: "#000",
          text: "#fff",
        },
      },
      light: {
        colors: {
          bg: "#fff",
          text: "#000",
        },
      },
    });

    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].selectorText
    ).toBe(".ui-dark-theme");
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[2])[0].selectorText
    ).toBe(".ui-light-theme");
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toStrictEqual(expect.stringContaining("--colors-bg: #000;"));
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[2])[0].cssText
    ).toStrictEqual(expect.stringContaining("--colors-bg: #fff;"));
  });

  it("removes tokens when eject is called", () => {
    const myStyles = createStyles();
    const eject = myStyles.insertThemes({
      dark: {
        colors: {
          bg: "#000",
          text: "#fff",
        },
      },
      light: {
        colors: {
          bg: "#fff",
          text: "#000",
        },
      },
    });

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(3);
    expect(myStyles.dash.inserted.size).toBe(2);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(2);
    eject();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    expect(myStyles.dash.inserted.size).toBe(0);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(0);
  });
});

describe(`styles.insertGlobal()`, () => {
  it("passes tokens to global styles", () => {
    const myStyles = createStyles();
    myStyles.insertTokens({
      colors: {
        blue: "#09a",
        red: "#c12",
      },
    });

    myStyles.insertThemes({
      dark: {
        colors: {
          bg: "#000",
          text: "#fff",
        },
      },
      light: {
        colors: {
          bg: "#fff",
          text: "#000",
        },
      },
    });

    myStyles.insertGlobal((vars) => {
      expect(vars).toMatchSnapshot();
      return "";
    });
  });

  it("injects global style object", () => {
    const styles_ = createStyles();
    styles_.insertGlobal({
      html: {
        color: "blue",
        ".foo": {
          color: "green",
        },
      },
    });

    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].selectorText
    ).toStrictEqual(expect.stringContaining("html"));
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[1].selectorText
    ).toStrictEqual(expect.stringContaining("html .foo"));
  });

  it("ejects global styles when callback is called", () => {
    const myStyles = createStyles();
    const eject = myStyles.insertGlobal(`
      html {
        font-size: 100%;
      }
    `);

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    eject();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    expect(myStyles.dash.inserted.size).toBe(0);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(0);
  });

  it("still exists in caches when a global is used more than once but ejected once", () => {
    const myStyles = createStyles();
    const ejectA = myStyles.insertGlobal(`
      html {
        font-size: 100%;
      }
    `);
    const ejectB = myStyles.insertGlobal(`
      html {
        font-size: 100%;
      }
    `);

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].selectorText
    ).toBe("html");
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toStrictEqual(expect.stringContaining("font-size: 100%;"));
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    ejectA();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(myStyles.dash.inserted.size).toBe(1);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(1);
    ejectB();
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1);
    expect(myStyles.dash.inserted.size).toBe(0);
    expect(Array.from(myStyles.dash.sheets.keys()).length).toBe(0);
  });

  it("allows @font-face", () => {
    const { insertGlobal } = createStyles();
    insertGlobal`
      @font-face {
        font-family: "Open Sans";
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
             url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
      }
    `;

    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toStrictEqual(expect.stringContaining("@font-face"));
  });

  it("allows style object", () => {
    const { insertGlobal } = createStyles();
    insertGlobal({
      ":root": {
        "--foo": "bar",
      },
    });

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2);
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].selectorText
    ).toBe(":root");
    expect(
      cssRules(document.querySelectorAll(`style[data-dash]`)[1])[0].cssText
    ).toStrictEqual(expect.stringContaining("--foo: bar;"));
  });
});

describe("styles.one()", () => {
  it("creates style w/ template literal", () => {
    const myStyles = createStyles();
    const myCls = myStyles.one`
      display: flex;
    `;

    myCls();
    expect(cssRules()[0].cssText).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });

  it("creates style w/ object", () => {
    const myStyles = createStyles();
    const myCls = myStyles.one({
      display: "block",
      span: {
        display: "flex",
      },
    });

    myCls();
    expect(cssRules()[0].cssText).toStrictEqual(
      expect.stringContaining("display: block;")
    );
    expect(cssRules()[1].selectorText).toStrictEqual(
      expect.stringContaining(" span")
    );
    expect(cssRules()[1].cssText).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });

  it(`won't create style def if falsy`, () => {
    const myStyles = createStyles();
    const myCls = myStyles.one`
      display: flex;
    `;

    myCls();
    expect(cssRules()[0].cssText).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });

  it(`won't create style if function call is provided falsy value`, () => {
    const myStyles = createStyles();
    const myCls = myStyles.one`
      display: flex;
    `;

    myCls(false);
    myCls(null);
    myCls(0);
    myCls("");

    expect(cssRules().length).toBe(0);
  });

  it(`returns css when css() is called`, () => {
    const myStyles = createStyles();
    const myCls = myStyles.one`
      display: flex;
    `;

    expect(myCls.css()).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });

  it(`wont return css when css() is called w/ falsy value`, () => {
    const myStyles = createStyles();
    const myCls = myStyles.one`
      display: flex;
    `;

    expect(myCls.css(false)).toBe("");
  });
  it(`can be called as a function w/ string value`, () => {
    const myStyles = createStyles();
    const myCls = myStyles.one("display: flex;");
    expect(myCls.css()).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });

  it(`can be called as a function w/ function value`, () => {
    type Tokens = {
      color: {
        blue: "blue";
      };
    };
    const myStyles = createStyles<Tokens>();
    myStyles.insertTokens({ color: { blue: "blue" } });
    const myCls = myStyles.one(({ color }) => `color: ${color.blue};`);
    expect(myCls.css()).toStrictEqual(
      expect.stringContaining("color: var(--color-blue);")
    );
  });
});

describe("styles.cls()", () => {
  it("creates style and inserts it into the dom right away", () => {
    const myStyles = createStyles();
    expect(
      typeof myStyles.cls`
      display: flex;
    `
    ).toBe("string");
    expect(cssRules()[0].cssText).toStrictEqual(
      expect.stringContaining("display: flex;")
    );
  });
});

describe("styles.lazy()", () => {
  it("creates style from serializable values", () => {
    const myStyles = createStyles();
    const lazyWidth = myStyles.lazy(({ width }: { width: number }) => ({
      width,
    }));

    expect(typeof lazyWidth({ width: 37 })).toBe("string");
    expect(cssRules()[0].cssText).toStrictEqual(
      expect.stringContaining("width: 37px;")
    );
    expect(typeof lazyWidth({ width: 36 })).toBe("string");
    expect(cssRules()[1].cssText).toStrictEqual(
      expect.stringContaining("width: 36px;")
    );
  });

  it("should return empty string if undefined value is provided", () => {
    const myStyles = createStyles();
    const lazyWidth = myStyles.lazy((width: number) => ({
      width,
    }));

    expect(typeof lazyWidth()).toBe("string");
    expect(cssRules().length).toBe(0);
  });
});

describe("styles.tokens", () => {
  it("should make CSS tokens available", () => {
    const myStyles = createStyles({
      tokens: {
        spacing: [0, "0.5rem"],
      },
    });

    expect(myStyles.tokens).toEqual({
      spacing: {
        0: "var(--spacing-0)",
        1: "var(--spacing-1)",
      },
    });
  });
});

describe("Exceptions", () => {
  it("throws for unterminated comments", () => {
    const style = createStyles().variants({
      flex: `
        /* this is a flex style with an unterminated comment ;)
        display: flex;
      `,
    });

    expect(() => {
      style("flex");
    }).toThrowErrorMatchingSnapshot();
  });
});

describe("pathToToken()", () => {
  it("should tokenize an object path", () => {
    expect(
      pathToToken<{
        button: { color: { primaryHover: "foo" } };
        color: { primary: "foo"; scale: [0, 1, 2, 3] };
      }>("color.scale.0")
    ).toEqual("var(--color-scale-0)");

    expect(pathToToken("color.scale.0")).toEqual("var(--color-scale-0)");

    expect(
      pathToToken<{
        button: { color: { primaryHover: "foo" } };
        color: { primary: "foo" };
      }>("button.color.primaryHover")
    ).toEqual("var(--button-color-primary-hover)");
  });
});
