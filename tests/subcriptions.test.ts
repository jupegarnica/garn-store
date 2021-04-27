import { PermissionError } from "../src/Errors.ts";
import { Store } from "../src/Store.ts";
import { RuleContext, Subscriber, Value } from "../src/types.ts";
import { assertEquals, assertThrows, spy } from "./test_deps.ts";
import type { Spy } from "./test_deps.ts";

Deno.test("[Store subscription] .subscribe", () => {
  const db = new Store();

  db.set("A", 0);
  let called = 0;
  const onChange: Subscriber = ({ newData }) => {
    called++;
    assertEquals(newData, called);
  };
  const id = db.subscribe("A", onChange);

  assertEquals(id, 1);
  assertEquals(called, 0);

  db.set("A", 1);
  assertEquals(called, 1);

  db.set("A", 2);
  assertEquals(called, 2);
});

Deno.test("[Store subscription] .subscribe assert payload", () => {
  const db = new Store();

  db.set("A", 0);
  let called = 0;
  const onChange: Subscriber = ({ newData, oldData }) => {
    called++;
    assertEquals(newData, 1);
    assertEquals(oldData, 0);
  };

  const id = db.subscribe("A", onChange);
  assertEquals(id, 1);
  assertEquals(called, 0);

  db.set("A", 1);
  assertEquals(called, 1);
});

Deno.test("[Store subscription] .subscribe assert payload inmutable", () => {
  const db = new Store();

  db.set("a", { b: 0 });
  let called = 0;
  const onChange: Subscriber = ({ newData, oldData }) => {
    called++;
    newData.b = 2;
    oldData.b = 3;
  };

  const id = db.subscribe("a", onChange);
  assertEquals(id, 1);
  assertEquals(called, 0);

  db.set("a.b", 1);
  assertEquals(called, 1);
  assertEquals(db.get("a"), { b: 1 });
});

Deno.test("[Store subscription] .subscribe checks read rule", () => {
  const db = new Store({
    rules: { _read: () => false },
    // initialData: { A: 0 },
  });
  assertThrows(() => db.subscribe("A", console.log), PermissionError, "read");
});

Deno.test("[Store subscription] .subscribe checks read dynamic rule ", () => {
  const mock: Spy<Console> = spy(console, "warn");
  const db = new Store({
    rules: {
      a: {
        _read: ({ data }: RuleContext) => {
          return data === 0;
        },
        _write: () => true,
      },
    },
    initialData: { a: 0 },
  });
  let calls = 0;
  const onChange: Subscriber = () => {
    calls++;
  };
  db.subscribe("a", onChange);
  db.set("a", 1);
  assertEquals(calls, 1);
  db.set("a", 2);
  assertEquals(calls, 1); // no called
  assertEquals(mock.calls.length, 1); // called console.warn
});

Deno.test("[Store subscription] .subscribe with deeper set", () => {
  const db = new Store();
  db.set("a.b", { c: 0, d: 0 });

  let called = 0;
  const onChange: Subscriber = ({ newData }) => {
    called++;
    assertEquals(newData.c, 1);
  };
  db.subscribe("a.b", onChange);

  assertEquals(called, 0);
  db.set("a.b.c", 1);
  assertEquals(called, 1);
  db.set("a.b.d", 2);
  assertEquals(called, 2);
});
Deno.test("[Store subscription] .on", () => {
  const db = new Store();

  db.set("A", 1);
  let called = 0;
  const onChange: Subscriber = ({ newData }) => {
    called++;
    assertEquals(newData, called);
  };
  const returned = db.on("A", onChange);

  assertEquals(returned, 1);
  assertEquals(called, 1);

  db.set("A", 2);
  assertEquals(called, 2);

  db.set("A", 3);
  assertEquals(called, 3);
});

Deno.test("[Store subscription] .on .off", () => {
  const db = new Store();

  db.set("A", 1);

  let called = false;
  const onChange: Subscriber = ({ newData }) => {
    called = true;
    assertEquals(newData, 1);
  };

  const id = db.on("A", onChange);
  assertEquals(called, true);
  db.off("A", id);
  called = false;
  db.set("A", 3); // should not call onChange
  assertEquals(called, false);

  let hasThrown = false;
  try {
    db.off("A", id);
  } catch (error) {
    hasThrown = true;
    assertEquals(error instanceof Error, true);
  }
  assertEquals(hasThrown, true);
});

Deno.test("[Store subscription] .subscribe .off", () => {
  const db = new Store();

  db.set("A", 1);

  let called = false;
  const onChange: Subscriber = ({ newData }) => {
    called = true;
    assertEquals(newData, 1);
  };

  const id = db.subscribe("A", onChange);
  assertEquals(called, false);
  db.off("A", id);
  assertEquals(called, false);
  db.set("A", 3); // should not call onChange
  assertEquals(called, false);

  assertThrows(() => {
    db.off("A", id);
  }, Error);
});

Deno.test("[Store subscription] Deep basic ", () => {
  const db = new Store();
  db.set("a.b.c", true);

  let called = false;
  const onChangeC: Subscriber = ({ newData }) => {
    called = true;
    assertEquals(newData, true);
  };
  const id = db.on("a.b.c", onChangeC);
  assertEquals(id, 1);
  assertEquals(called, true);
});

Deno.test("[Store subscription] Deep complex", () => {
  const db = new Store();
  db.set("a.b.c", true);
  let called = 0;
  const onChange: Subscriber = ({ newData }) => {
    called++;
    if (called === 1) {
      assertEquals(newData, { c: true });
    }
    if (called === 2) {
      assertEquals(newData, { c: 33 });
    }
    if (called === 3) {
      assertEquals(newData, { c: 33, d: 34 });
    }
    if (called === 4) {
      assertEquals(newData, undefined);
    }
  };

  const id = db.on("a.b", onChange);

  //  should be called
  assertEquals(id, 1);
  assertEquals(called, 1);

  db.set("a.b.c", 33);
  assertEquals(db.get("a.b.c"), 33);
  assertEquals(called, 2);

  db.set("a.b.d", 34);
  assertEquals(called, 3);

  db.set("a", 1);
  assertEquals(called, 4);

  //  should not be called
  db.set("a.z", true);
  db.set("z", true);

  assertEquals(called, 4);
});

Deno.test("[Store subscription] inmutable callback", () => {
  const db = new Store();
  db.set("a.b.c", 0);

  let called = 0;
  const onChange = ({ newData }: Value) => {
    // console.log(newData);

    called++;
    assertEquals(newData, { c: 1 });
    newData.c = 2;
    assertEquals(newData, { c: 2 });
  };
  db.subscribe("a.b", onChange);

  assertEquals(called, 0);
  db.set("a.b.c", 1);
  assertEquals(called, 1);
  assertEquals(db.get("a.b.c"), 1);
});

Deno.test("[Store subscription] Deep remove with subscription", () => {
  const db = new Store();
  db.set("a.b.c", 1);

  let called = 0;
  const onChange: Subscriber = ({ newData }) => {
    called++;
    if (called === 1) {
      assertEquals(newData, called);
    } else if (called === 2) {
      assertEquals(newData, undefined);
    }
  };
  db.on("a.b.c", onChange);

  assertEquals(called, 1);

  const B = db.remove("a.b");
  assertEquals(called, 2);

  assertEquals(B, { c: 1 });
  assertEquals(db.get("a.b.c"), undefined);
});
