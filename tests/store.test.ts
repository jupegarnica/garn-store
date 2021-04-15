import { Store } from '../src/Store.ts';
import { assertEquals, assertThrows } from './test_deps.ts';

// Non persistance Store
////////////////////////

Deno.test('[Store] Simple set and get', () => {
  const db = new Store();
  db.set('a', 1);
  const A = db.get('a');
  assertEquals(A, 1);

  const B = db.get('a.b');
  assertEquals(B, undefined);
});

Deno.test('[Store] setting arrays', () => {
  const db = new Store();
  db.set('a', []);
  const A = db.get('a');
  assertEquals(A, []);

  db.set('b.0.a', 1);
  const B = db.get('b');

  assertEquals(B, [{ a: 1 }]);

  db.set('c.0.0', 1);
  const C = db.get('c');
  assertEquals(C, [[1]]);

  db.set('d.1.1.1', 1);
  const D = db.get('d');
  assertEquals(D, [, [, [, 1]]]);

  db.set('e', [0]);
  db.set('e.1.1.1', 1);
  const E = db.get('e');
  assertEquals(E, [0, [, [, 1]]]);
});

Deno.test('[Store] invalid path', () => {
  const db = new Store();
  assertThrows(() => {
    db.set('', []);
  });
  assertThrows(() => {
    db.get('');
  });
});

Deno.test('[Store] Deep remove', () => {
  const db = new Store();
  db.set('a.b.c', true);

  const B = db.remove('a.b');

  assertEquals(B, { c: true });
  assertEquals(db.get('a.b.c'), undefined);
});

Deno.test('[Store] Deep remove array child', () => {
  const db = new Store();
  db.set('a.b', [0, 1, 2]);

  const B = db.remove('a.b.1');

  assertEquals(B, 1);
  assertEquals(db.get('a.b'), [0, 2]);
});

Deno.test('[Store] Deep remove with subscription', () => {
  const db = new Store();
  db.set('a.b.c', 1);

  let called = 0;
  const onChange = (data: unknown) => {
    called++;
    if (called === 1) {
      assertEquals(data, called);
    } else if (called === 2) {
      assertEquals(data, undefined);
    } else {
      throw new Error('should not be called');
    }
  };
  const returned = db.on('a.b.c', onChange);

  assertEquals(returned, 1);
  assertEquals(called, 1);

  const B = db.remove('a.b');
  assertEquals(called, 2);

  assertEquals(B, { c: 1 });
  assertEquals(db.get('a.b.c'), undefined);
});

Deno.test('[Store] Deep set and get', () => {
  const db = new Store();
  db.set('a.b.c', true);
  const C = db.get('a.b.c');
  assertEquals(C, true);
  const B = db.get('a.b');
  assertEquals(B, { c: true });
});

Deno.test('[Store] Deep set and get undefined', () => {
  const db = new Store();
  db.set('a.b.c', true);
  const C = db.get('a.c');
  assertEquals(C, undefined);
  const B = db.get('a.b.c.z.x.x');
  assertEquals(B, undefined);
});

Deno.test('[Store] DB subscription on', () => {
  const db = new Store();

  db.set('A', 1);
  let called = 0;
  const onChange = (data: unknown) => {
    called++;
    assertEquals(data, called);
  };
  const returned = db.on('A', onChange);

  assertEquals(returned, 1);
  assertEquals(called, 1);

  db.set('A', 2);
  assertEquals(called, 2);

  db.set('A', 3);
  assertEquals(called, 3);
});

Deno.test('[Store] DB subscription off', () => {
  const db = new Store();

  db.set('A', 1);

  let called = false;
  const onChange = (data: unknown) => {
    called = true;
    assertEquals(data, 1);
  };

  db.on('A', onChange);
  assertEquals(called, true);
  db.off('A', onChange);
  called = false;
  db.set('A', 3); // should not call onChange
  assertEquals(called, false);

  let hasThrown = false;
  try {
    db.off('A', onChange);
  } catch (error) {
    hasThrown = true;
    assertEquals(error instanceof Error, true);
  }
  assertEquals(hasThrown, true);
});

Deno.test('[Store] Deep basic subscription ', () => {
  const db = new Store();
  db.set('a.b.c', true);

  let called = false;
  const onChangeC = (data: unknown) => {
    called = true;
    assertEquals(data, true);
  };
  const C = db.on('a.b.c', onChangeC);
  assertEquals(C, true);

  assertEquals(called, true);
});

// false &&
Deno.test('[Store] Deep complex subscription', () => {
  const db = new Store();
  db.set('a.b.c', true);

  let called = 0;
  const onChange = (data: unknown) => {
    called++;
    if (called === 1) {
      assertEquals(data, { c: true });
    }
    if (called === 2) {
      assertEquals(data, { c: 33 });
    }
    if (called === 3) {
      assertEquals(data, { c: 33, d: 34 });
    }
    if (called === 4) {
      assertEquals(data, undefined);
    }
  };

  const B = db.on('a.b', onChange);

  //  should be called
  assertEquals(B, { c: true });
  assertEquals(called, 1);

  db.set('a.b.c', 33);
  assertEquals(db.get('a.b.c'), 33);
  assertEquals(called, 2);

  db.set('a.b.d', 34);
  assertEquals(called, 3);

  db.set('a', 1);
  assertEquals(called, 4);

  //  should not be called
  db.set('a.z', true);
  db.set('z', true);
  assertEquals(called, 4);
});

Deno.test('[Store] push into an array', () => {
  const db = new Store();
  db.set('a.b', []);

  const B = db.push('a.b', 1);

  assertEquals(B, 1);
  assertEquals(db.get('a.b'), [1]);
});

Deno.test('[Store] push into an not array', () => {
  const db = new Store();
  db.set('a.b', {});

  assertThrows(() => {
    db.push('a.b', 1);
  });
});

Deno.test('[Store] Set inmutable behavior', () => {
  const db = new Store();
  const obj = { b: 1 };
  db.set('a', obj);
  obj.b = 2;

  const B = db.get('a.b');
  assertEquals(B, 1);
});

Deno.test('[Store] Get inmutable behavior', () => {
  const db = new Store();
  db.set('a', { b: 1 });

  const A = db.get('a');
  A.b = 2;

  const B = db.get('a.b');
  assertEquals(B, 1);
});
