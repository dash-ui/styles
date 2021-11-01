import bench_ from "@essentials/benchmark";
import { css } from "emotion";
import { styles } from "../dist/module";

function bench(name: string, callback: () => void) {
  bench_(name, ({ duration }) => {
    duration(1000);
    return callback;
  });
}

bench("emotion css [smol object]", () =>
  css({
    display: "flex",
  })
);

bench("use cls [smol object]", () =>
  styles.cls({
    display: "flex",
  })
);

bench("emotion css [big object]", () =>
  css({
    display: "flex",
    color: "blue",
    position: "relative",
    width: 640,
    height: 320,
    backgroundColor: "green",
    transition: "foo bar",
    margin: "0 auto",
  })
);

bench("use cls [big object]", () =>
  styles.cls({
    display: "flex",
    color: "blue",
    position: "relative",
    width: 640,
    height: 320,
    backgroundColor: "green",
    transition: "foo bar",
    margin: "0 auto",
  })
);

bench(
  "emotion css [string]",
  () =>
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
    `
);

bench(
  "use cls [string]",
  () => styles.cls`
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
  `
);

bench_("[cold] emotion css [object]", ({ duration, before }) => {
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

bench_("[cold] use cls [object]", ({ duration, before }) => {
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

bench_("[cold] emotion css [string]", ({ duration, before }) => {
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

bench_("[cold] use cls [string]", ({ duration, before }) => {
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

bench("create styles [object]", () =>
  styles.variants({ foo: { display: "flex" } })
);

bench("create styles [string]", () =>
  styles.variants({ foo: `display: flex;` })
);

bench("create one [object]", () => styles.one({ display: "flex" })());

bench("create one [string]", () => styles.one(`display: flex;`)());

const uno = styles.one(`display: flex;`);

bench("use one", () => uno());

const lazy = styles.lazy((value) => `background-color:${value};`);

bench("use lazy [string]", () => lazy("blue"));

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

const styleDefault = styles.variants({
  default: { display: "block" },
  flex: { display: "flex" },
});
bench("style w/ default", () => styleDefault("flex"));
bench("multi-style w/ default", () => styleDefault("foo", "flex"));
bench("object-style w/ default", () =>
  styleDefault({ foo: true, bar: false }, "flex")
);

bench_("[cold] style", ({ duration, before }) => {
  duration(1000);
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style(key);
});
bench_("[cold] multi-style", ({ duration, before }) => {
  duration(1000);
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style(key, "bar");
});
bench_("[cold] object style", ({ duration, before }) => {
  duration(1000);
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: { width: key } });
  });
  return () => style({ bar: true, [key]: true }, "bar");
});

bench_("[cold] style callback", ({ duration, before }) => {
  duration(1000);
  let style;
  let key;
  before(() => {
    key = String(Math.random());
    style = styles.variants({ [key]: () => ({ width: key }) });
  });
  return () => style(key, "bar");
});

bench_("[cold] lazy style string", ({ duration, before }) => {
  duration(1000);
  let style;
  let value;
  before(() => {
    style = styles.lazy(
      (backgroundColor) => `background-color:${backgroundColor}`
    );
    value = Math.random();
  });
  return () => style(value);
});

bench_("[cold] lazy style object", ({ duration, before }) => {
  duration(1000);
  let style;
  let value;
  before(() => {
    style = styles.lazy((backgroundColor) => ({ backgroundColor }));
    value = Math.random();
  });
  return () => style(value);
});

bench_("[cold] lazy style callback", ({ duration, before }) => {
  duration(1000);
  let style;
  let value;
  before(() => {
    style = styles.lazy((backgroundColor) => (t) => ({ backgroundColor }));
    value = Math.random();
  });
  return () => style(value);
});
