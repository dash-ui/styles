/**
 * @jest-environment node
 */
import * as fs from "fs";
import { createDash, createStyles, styles } from "../../src";
import {
  createStyleTagFromCache,
  createStyleTagFromString,
  writeStylesFromCache,
  writeStylesFromString,
} from "./index";

afterEach(() => {
  styles.dash.inserted.clear();
  styles.dash.sheet.flush();
});

describe("Configure", () => {
  it("removes vendor prefixing", () => {
    const myStyles = createStyles({ dash: createDash({ prefix: false }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("has customized vendor prefixing", () => {
    // adds prefixes to transform, but not flex
    const prefix = function (key, value, context): boolean {
      if (typeof context !== "number") throw "fail";

      switch (key) {
        case "transform":
          return true;
        case "disable":
          if (value !== "flex") throw "fail";
        // eslint-disable-next-line
        default:
          return false;
      }
    };

    const myStyles = createStyles({ dash: createDash({ prefix }) });
    const style = myStyles.variants({
      flex: { display: "flex", transform: "translateX(30px)" },
    });

    style("flex");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it('changes key to "css"', () => {
    const myStyles = createStyles({ dash: createDash({ key: "css" }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });
});

describe("createStyleTagFromCache", () => {
  it("uses default styles", () => {
    const style = styles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(createStyleTagFromCache()).toMatchSnapshot();
  });

  it("adds nonce to style tags", () => {
    const myStyles = createStyles({
      dash: createDash({ nonce: "EDNnf03nceIOfn39fn3e9h3sdfa" }),
    });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("extracts global styles", () => {
    const myStyles = createStyles({});
    myStyles.insertGlobal`
      :root {
        --hello: "world";
      } 
    `;

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("extracts global tokens", () => {
    const myStyles = createStyles({});
    myStyles.insertTokens({
      colors: {
        blue: "#09a",
      },
    });

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("extracts theme tokens", () => {
    const myStyles = createStyles({
      themes: {
        dark: {
          colors: {
            primary: "#000",
          },
        },
        light: {
          colors: {
            primary: "#fff",
          },
        },
      },
    });

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
    myStyles.theme("dark");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
    myStyles.theme("light");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("caches styles", () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });

    style("flex");
    style("btn");
    style("flex");
    style("btn");
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot();
  });

  it("clears cached styles after render when `clearCache` is true", () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });

    style("flex");
    style("btn");
    style("flex");
    style("btn");
    expect(
      createStyleTagFromCache(myStyles, { clearCache: true })
    ).toMatchSnapshot();
    expect(
      createStyleTagFromCache(myStyles, { clearCache: true })
    ).toMatchSnapshot("empty");
  });
});

describe("createStyleTagFromString", () => {
  it("uses default styles instance", () => {
    const style = styles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(
      createStyleTagFromString(`<div className=${style("flex")}>`)
    ).toMatchSnapshot();
  });

  it("adds nonce to style tags", () => {
    const myStyles = createStyles({
      dash: createDash({ nonce: "EDNnf03nceIOfn39fn3e9h3sdfa" }),
    });
    const style = myStyles.variants({
      flex: { display: "flex" },
    });

    style("flex");
    expect(
      createStyleTagFromString(`<div className=${style("flex")}>`, myStyles)
    ).toMatchSnapshot();
  });

  it("extracts global styles", () => {
    const myStyles = createStyles({});
    myStyles.insertGlobal`
      :root {
        --hello: "world";
      }
    `;

    expect(createStyleTagFromString("", myStyles)).toMatchSnapshot();
  });

  it("extracts global tokens", () => {
    const myStyles = createStyles({});
    myStyles.insertTokens({
      colors: {
        blue: "#09a",
      },
    });

    expect(createStyleTagFromString("", myStyles)).toMatchSnapshot();
  });

  it("caches styles", () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });

    style("flex");
    style("btn");
    style("flex");
    style("btn");
    expect(
      createStyleTagFromString(
        `
      <div class=${style("flex")}>
        <div class=${style("btn")}>
          Hello
        </div>
      </div>
    `,
        myStyles
      )
    ).toMatchSnapshot();
  });
});

describe("writeStylesFromString", () => {
  it("writes from default styles instance", async () => {
    const style = styles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });

    const finfo = await writeStylesFromString(
      `
        <div class=${style("flex")}>
          <div class=${style("btn")}>
            Hello
          </div>
        </div>
      `,
      "./"
    );

    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes", async () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });

    const finfo = await writeStylesFromString(
      `
        <div class=${style("flex")}>
          <div class=${style("btn")}>
            Hello
          </div>
        </div>
      `,
      "./",
      myStyles
    );
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom name", async () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromString(
      `
        <div class=${style("flex")}>
          <div class=${style("btn")}>
            Hello
          </div>
        </div>
      `,
      "./",
      myStyles,
      { name: "foo.css" }
    );
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom key", async () => {
    const myStyles = createStyles({ dash: createDash({ key: "css" }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromString(
      `
        <div class=${style("flex")}>
          <div class=${style("btn")}>
            Hello
          </div>
        </div>
      `,
      "./",
      myStyles
    );
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom hash", async () => {
    const myStyles = createStyles({ hash: () => "f8bCooDawg" });
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromString(
      `
        <div class=${style("flex")}>
          <div class=${style("btn")}>
            Hello
          </div>
        </div>
      `,
      "./",
      myStyles
    );
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });
});

describe("writeStylesFromCache", () => {
  it("writes from default styles instance", async () => {
    const style = styles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromCache();
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes", async () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromCache("./", myStyles);
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom name", async () => {
    const myStyles = createStyles({});
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromCache("./", myStyles, {
      name: "foo.css",
    });
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom key", async () => {
    const myStyles = createStyles({ dash: createDash({ key: "css" }) });
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromCache("./", myStyles);
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });

  it("writes custom hash", async () => {
    const myStyles = createStyles({ hash: () => "f8bCooDawg" });
    const style = myStyles.variants({
      flex: { display: "flex" },
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    });
    style("flex");
    style("btn");

    const finfo = await writeStylesFromCache("./", myStyles);
    expect(fs.existsSync(finfo.filename)).toBe(true);
    fs.unlinkSync(finfo.filename);
    expect(finfo).toMatchSnapshot();
  });
});
