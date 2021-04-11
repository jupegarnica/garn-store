import { Store } from './mod.ts';
import { existsSync } from './deps.ts';
import { assertEquals } from './test_deps.ts';
const testStorePath = './test.store.json';

Deno.test('Empty DB', async () => {
  const db = new Store(testStorePath);
  await db.write();

  assertEquals(existsSync(db.storePath), false);
});

Deno.test('Simple Number DB', async () => {
  const db = new Store(testStorePath);

  db.set('number', 5);
  assertEquals(db.get('number'), 5);

  await db.write();

  assertEquals(existsSync(db.storePath), true);

  await Deno.remove(db.storePath);
});

Deno.test('DB subscription on', () => {
  const db = new Store(testStorePath);

  db.set('A', 1);
  let called = false;
  const onChange = (data: unknown) => {
    called = true;
    assertEquals(data, 1);
  };
  const returned = db.on('A', onChange);

  assertEquals(returned, 1);
  assertEquals(called, true);
});

Deno.test('DB subscription off', () => {
  const db = new Store(testStorePath);

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

Deno.test('DB load / write / delete store', async () => {
  const db = new Store(testStorePath);

  db.set('number5', 5);
  db.set('number10', 10);

  await db.write(testStorePath);

  const db2 = new Store(testStorePath);

  assertEquals(db2.get('number5'), 5);

  assertEquals(existsSync(db.storePath), true);

  await db.deleteStore();
  // await db2.deleteStore();

  // Make sure to clean up first in case of assert failure.
  const x = existsSync(db.storePath);
  // if (x) await Deno.remove(db.storePath);

  assertEquals(x, false);
});

Deno.test('Deep set and get', () => {
  const db = new Store(testStorePath);
  db.set('a.b.c', true);
  const C = db.get('a.b.c');
  assertEquals(C, true);
  const B = db.get('a.b');
  assertEquals(B, { c: true });
});


Deno.test('Deep set and get undefined', () => {
  const db = new Store(testStorePath);
  db.set('a.b.c', true);
  const C = db.get('a.c');
  assertEquals(C, undefined);
  const B = db.get('a.b.c.z.x.x');
  assertEquals(B, undefined);
});

// Deno.test('Deep set and get override', () => {
//   const db = new Store(testStorePath);
//   db.set('a.b.c', true, false);

//   const C = db.set('a.c', true);

//   assertEquals(C, undefined);

// });



Deno.test('Deep set and get subscription', () => {
  const db = new Store(testStorePath);
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
Deno.test('Deep set and get subscription', () => {
  const db = new Store(testStorePath);
  db.set('a.b.c', true);

  {
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
        assertEquals(data, undefined);
      }
    };

    const C = db.on('a.b', onChange);

    //  should be called
    assertEquals(C, { c: true });
    assertEquals(called, 1);

    // TODO make it work
    db.set('a.b.c', 33);
    assertEquals(called, 2);

    db.set('a', 1);
    assertEquals(called, 3);

    //  should not be called
    db.set('a.z', true);
    db.set('z', true);
    assertEquals(called, 3);
  }
});