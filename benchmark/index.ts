import bench from "@essentials/benchmark";
import { css } from "emotion";
import { styles } from "../dist/module";

bench("emotion css [smol object]", ({ duration }) => {
  duration(1000);
  return () =>
    css({
      display: "flex",
    });
});

bench("use cls [smol object]", ({ duration }) => {
  duration(1000);
  return () =>
    styles.cls({
      display: "flex",
    });
});

bench("emotion css [big object]", ({ duration }) => {
  duration(1000);
  return () =>
    css({
      display: "flex",
      color: "blue",
      position: "relative",
      width: 640,
      height: 320,
      backgroundColor: "green",
      transition: "foo bar",
      margin: "0 auto",
    });
});

bench("use cls [big object]", ({ duration }) => {
  duration(1000);
  return () =>
    styles.cls({
      display: "flex",
      color: "blue",
      position: "relative",
      width: 640,
      height: 320,
      backgroundColor: "green",
      transition: "foo bar",
      margin: "0 auto",
    });
});

bench("emotion css [string]", ({ duration }) => {
  duration(1000);
  return () =>
    css`
      display: inline-block;
      border: none;
      background: transparent;
      padding: 0.5rem 1rem;
      font-weight: 700;

      /**
      * Dash uses a CSS preprocessor called stylis so nesting,
      * autoprefixing, etc. come out of the box.
      * https://www.npmjs.com/package/stylis
      */
      :active {
        transform: translateY(1px);
      }
    `;
});

bench("use cls [string]", ({ duration }) => {
  duration(1000);
  return () => styles.cls`
    display: inline-block;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    font-weight: 700;

    /**
     * Dash uses a CSS preprocessor called stylis so nesting,
     * autoprefixing, etc. come out of the box.
     * https://www.npmjs.com/package/stylis
     */
    :active {
      transform: translateY(1px);
    }
  `;
});

bench("[cold] emotion css [object]", ({ duration, before }) => {
  duration(1000);
  let key;
  before(() => {
    key = String(Math.random());
  });
  return () =>
    css({
      width: key,
      display: "flex",
      color: "blue",
      position: "relative",
      height: 320,
      backgroundColor: "green",
      transition: "foo bar",
      margin: "0 auto",
    });
});

bench("[cold] use cls [object]", ({ duration, before }) => {
  duration(1000);
  let key;
  before(() => {
    key = String(Math.random());
  });
  return () =>
    styles.cls({
      width: key,
      display: "flex",
      color: "blue",
      position: "relative",
      height: 320,
      backgroundColor: "green",
      transition: "foo bar",
      margin: "0 auto",
    });
});

bench("[cold] emotion css [string]", ({ duration, before }) => {
  duration(1000);
  let key;
  before(() => {
    key = String(Math.random());
  });
  return () =>
    css`
      width: ${key};
      display: inline-block;
      border: none;
      background: transparent;
      padding: 0.5rem 1rem;
      font-weight: 700;

      /**
     * Dash uses a CSS preprocessor called stylis so nesting,
     * autoprefixing, etc. come out of the box.
     * https://www.npmjs.com/package/stylis
     */
      :active {
        transform: translateY(1px);
      }
    `;
});

bench("[cold] use cls [string]", ({ duration, before }) => {
  duration(1000);
  let key;
  before(() => {
    key = String(Math.random());
  });
  return () => styles.cls`
    width: ${key};
    display: inline-block;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    font-weight: 700;

    /**
     * Dash uses a CSS preprocessor called stylis so nesting,
     * autoprefixing, etc. come out of the box.
     * https://www.npmjs.com/package/stylis
     */
    :active {
      transform: translateY(1px);
    }
  `;
});

bench("create styles [object]", ({ duration }) => {
  duration(1000);
  return () => styles.variants({ foo: { display: "flex" } });
});

bench("create styles [string]", ({ duration }) => {
  duration(1000);
  return () => styles.variants({ foo: `display: flex;` });
});

bench("create one [object]", ({ duration }) => {
  duration(1000);
  return () => styles.one({ display: "flex" })();
});

bench("create one [string]", ({ duration }) => {
  duration(1000);
  return () => styles.one(`display: flex;`)();
});

const uno = styles.one(`display: flex;`);

bench("use one", ({ duration }) => {
  duration(1000);
  return () => uno();
});

const style = styles.variants({ foo: { display: "flex" } });
bench("style", () => style("foo"));
bench("multi-style", () => style("foo", "bar"));
bench("object-style", () => style({ foo: true, bar: false }, "bar"));

const styleCallback = styles.variants({ foo: () => ({ display: "flex" }) });
bench("style [callback]", () => styleCallback("foo"));
bench("multi-style [callback]", () => styleCallback("foo", "bar"));
bench("object-style [callback]", () =>
  styleCallback({ foo: true, bar: false }, "bar")
);

bench("[cold] style", ({ before }) => {
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style(key);
});
bench("[cold] multi-style", ({ before }) => {
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style(key, "bar");
});
bench("[cold] object style", ({ before }) => {
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style({ bar: true, [key]: true }, "bar");
});

bench("[cold] style callback", ({ before }) => {
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: () => ({ width: key }) });
  });
  return () => style(key, "bar");
});
