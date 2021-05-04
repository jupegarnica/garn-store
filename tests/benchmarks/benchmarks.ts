import {
  bench,
  runBenchmarks,
} from "https://deno.land/std@0.93.0/testing/bench.ts";
import type {
  BenchmarkRunOptions,
  BenchmarkRunProgress,
} from "https://deno.land/std@0.93.0/testing/bench.ts";

import { duration } from "https://deno.land/x/tims/mod.ts";
import * as colors from "https://deno.land/std@0.93.0/fmt/colors.ts";
import { StoreJson } from "../../core/StoreJson.ts";
import { StoreYaml } from "../../core/StoreYaml.ts";
import { StoreBson } from "../../core/StoreBson.ts";
import { KeyValue, ObserverContext } from "../../core/types.ts";

const FOLDER = "data";

const only = Deno.args[1] ? new RegExp(Deno.args[1]) : new RegExp(".");

const RUNS = Number(Deno.args[0]) ||
  1e5;

1e3;
1e4;
60709; // fails
1e6;
3e6;
1e7;

const resultsOptions = {
  name: `results.json`,
  autoSave: true,
};
const benchOptions: [
  BenchmarkRunOptions,
  ((progress: BenchmarkRunProgress) => void | Promise<void>),
] = [{
  // skip: /Yaml/i,
  skip: /(Bson)|(Yaml)/i,
  only,
  // skip: /(autoSave)|(Bson)/i,
  // only: /Set Json. autoSave/,
  // only: /GetAll/,
  // only: /\[Set\]/,
  // only: /(\[Get\])/,
  // only: /Write/,
  // only: /Load/,
  // only: /(Load)|(Write)/,
  // only: /(Get)|(Set)|(Load)|(Write)/,
  // only: /(\[Get\])|(\[Set\])/,
  // only: /(Find)|(FindOne)|(Set)/,
  // only: /(BSON)|(JSON)/i,
  // silent: true,
}, () => {} // (p: BenchmarkRunProgress) => {
  // initial progress data

  // console.log(p.state);
  // if (p.state === ProgressState.BenchmarkingStart) {
  //   console.log(
  //     `Starting benchmarking. Queued: ${p.queued?.length}, filtered: ${p.filtered}`,
  //   );
  // }
  // }
];
const d = (time: number): string => {
  if (time > 5000) {
    return duration(time, { format: "second", locale: "en" });
  }
  return time.toFixed(2);
};
const toOpsEverySecond = (timeInMs: number, ops: number) =>
  ops * 1000 / timeInMs;

// SET
//////
bench({
  name: `[Set] warmup OPS=${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });

      // db.set(`item` + i, {
      //   i: { i: { i: { i: { i: { i: { i: { i: { i: { i: { i } } } } } } } } } },
      // });
    }
    b.stop();
  },
});

bench({
  name: `[Set] OPS=${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
    db.write();
  },
});
bench({
  name: `[Set Bson]  OPS=${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreBson({
      name: `${FOLDER}/${RUNS}.bson`,
    });
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
    db.write();
  },
});

bench({
  name: `[Set Yaml] OPS=${RUNS} set ${RUNS}children`,
  runs: 1,
  func(b): void {
    const db = new StoreYaml({
      name: `${FOLDER}/${RUNS}.yaml`,
    });
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
    db.write();
  },
});
bench({
  name: `[Set Json] OPS=${RUNS} autoSave ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({
      name: `${FOLDER}/${RUNS}.json`,
      autoSave: true,
    });
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
  },
});

bench({
  name: `[Set Bson] OPS=${RUNS} autoSave ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreBson({
      name: `${FOLDER}/${RUNS}.bson`,
      autoSave: true,
    });
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
  },
});

bench({
  name: `[Set Yaml] OPS=${RUNS} autoSave ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreYaml({
      name: `${FOLDER}/${RUNS}.yaml`,
      autoSave: true,
    });
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set(`item` + i, { i: { i: { i } } });
    }
    b.stop();
    db.write();
  },
});

// Get
//////

bench({
  name: `[GetAll] OPS=1 assert ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    const all = db.get(``);
    b.stop();
    const length = Object.keys(all).length;
    if (length !== RUNS) {
      throw new Error(`not ${RUNS} children, ${length}`);
    }
  },
});

bench({
  name: `[GetAll] OPS=1 getRef ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    db.getRef("");
    b.stop();
  },
});

bench({
  name: `[Get] ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.get(`item` + i);
    }
    b.stop();
  },
});

bench({
  name: `[Get] OPS=${RUNS} getRef ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.getRef(`item` + i);
    }
    b.stop();
  },
});

// bench({
//   name: `[Get] ${RUNS} runs`,
//   runs: RUNS,
//   func(b): void {
//     b.start();
//     db.get(`item0`);
//     b.stop();
//   },
// });

// Find
//////

bench({
  name: `[Find] OPS=${RUNS} children reading value`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    const results = db.find("", ([, value]: KeyValue) => value);
    b.stop();
    if (results.length !== RUNS) {
      throw new Error(`not ${RUNS} children, ${results.length}`);
    }
  },
});

bench({
  name: `[Find] OPS=${RUNS} children without reading value`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });

    b.start();
    const results = db.find("", () => true);
    b.stop();
    if (results.length !== RUNS) {
      throw new Error(`not ${RUNS} children, ${results.length}`);
    }
  },
});

// Load
//////

bench({
  name: `[Load Json] OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    b.start();
    new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    b.stop();
  },
});

// bench({
//   name: `[Load Json] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
//     }
//     b.stop();
//   },
// });

// bench({
//   name: `[Load Json] ${RUNS} runs`,
//   runs: RUNS,
//   func(b): void {
//     b.start();
//     new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
//     b.stop();
//   },
// });

bench({
  name: `[Load Bson] OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    b.start();
    new StoreBson({ name: `${FOLDER}/${RUNS}.bson` });
    b.stop();
  },
});

// bench({
//   name: `[Load Bson] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       new StoreBson({ name: `${FOLDER}/${RUNS}.bson` });
//     }
//     b.stop();
//   },
// });

// bench({
//   name: `[Load Bson] ${RUNS} runs`,
//   runs: RUNS,
//   func(b): void {
//     b.start();
//     new StoreBson({ name: `${FOLDER}/${RUNS}.bson` });
//     b.stop();
//   },
// });

bench({
  name: `[Load Yaml]  OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    b.start();
    new StoreYaml({ name: `${FOLDER}/${RUNS}.yaml` });
    b.stop();
  },
});

// bench({
//   name: `[Load Yaml] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       new StoreYaml({ name: `${FOLDER}/${RUNS}.yaml` });
//     }
//     b.stop();
//   },
// });

// bench({
//   name: `[Load Yaml] ${RUNS} runs`,
//   runs: RUNS,
//   func(b): void {
//     b.start();
//     new StoreYaml({ name: `${FOLDER}/${RUNS}.yaml` });
//     b.stop();
//   },
// });

// Write
////////

bench({
  name: `[Write Json]  OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    b.start();
    db.write();
    b.stop();
  },
});

// bench({
//   name: `[Write Json] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       db.write();
//     }
//     b.stop();
//   },
// });

bench({
  name: `[Write Bson]  OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreBson({ name: `${FOLDER}/${RUNS}.bson` });
    b.start();
    db.write();
    b.stop();
  },
});

// bench({
//   name: `[Write Bson] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     new StoreBson({ name: `${FOLDER}/${RUNS}.bson` });
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       db.write();
//     }
//     b.stop();
//   },
// });

bench({
  name: `[Write Yaml]  OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreYaml({ name: `${FOLDER}/${RUNS}.yaml` });
    b.start();
    db.write();
    b.stop();
  },
});

// bench({
//   name: `[Write Yaml] ${RUNS} times`,
//   runs: 1,
//   func(b): void {
//     new StoreYaml({ name: `${FOLDER}/${RUNS}.yaml` });
//     b.start();
//     for (let i = 0; i < RUNS; i++) {
//       db.write();
//     }
//     b.stop();
//   },
// });
bench({
  name: `[Subscribe] OPS=${RUNS} sets ${RUNS}  children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    db.observe("$item/i/i", () => {});
    b.start();
    for (let i = 0; i < RUNS; i++) {
      db.set("item" + i, "HELLO");
    }
    b.stop();
  },
});
bench({
  name: `[Subscribe] OPS=1 with 2 params ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    db.observe("$item/i/$i", () => {});
    b.start();
    db.set("item" + RUNS, "HELLO");
    b.stop();
  },
});
bench({
  name: `[Subscribe] OPS=1 ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    db.observe("$item/i/i", () => {});
    b.start();
    db.set("item" + RUNS, "HELLO");
    b.stop();
  },
});
bench({
  name: `[Subscribe] OPS=1 cloning payload ${RUNS} children`,
  runs: 1,
  func(b): void {
    const db = new StoreJson({ name: `${FOLDER}/${RUNS}.json` });
    db.observe(
      "$item/i/i",
      ({ newData, oldData }: ObserverContext) => ({ newData, oldData }),
    );
    b.start();
    db.set("item" + RUNS, "HELLO");
    b.stop();
  },
});

const { results } = await runBenchmarks(...benchOptions);

const dbResults = new StoreJson(resultsOptions);

for (const result of results) {
  const { name, runsCount, measuredRunsAvgMs } = result;
  dbResults.set(
    `results/${name}`,
    (old: { [k: string]: number }) => {
      // const lastOld = old?.lastRun ?? 0;
      const totalRunsOld = old?.totalRuns ?? 0;
      const averageRunOld = old?.averageRun ?? 0;
      const totalRuns = (totalRunsOld) + runsCount;

      const averageRun = ((averageRunOld * totalRunsOld) +
        (measuredRunsAvgMs * runsCount)) / totalRuns;

      const diff = measuredRunsAvgMs - averageRun;
      const diffRatio = measuredRunsAvgMs / averageRun;
      const improvement = -(1 - diffRatio);
      let operations = Number(name.match(/OPS=\d+/)?.[0].replace("OPS=", ""));
      operations = operations || RUNS;
      const data = ({
        totalRuns,
        lastRun: measuredRunsAvgMs,
        diff,
        diffRatio,
        improvement,
        averageRun,
      });

      const text = `${(data.improvement * 100).toFixed(2)}`;
      const imp = data.improvement > 0 ? colors.red(text) : colors.green(text);
      console.group(colors.dim(name));
      console.debug(
        colors.bold(imp),
        " ".repeat((9 - text.length)),
        colors.bold(colors.blue(d(measuredRunsAvgMs))),
        colors.inverse(
          `${
            parseNumberToString(toOpsEverySecond(measuredRunsAvgMs, operations))
          }`,
        ),
        colors.blue(d(averageRun)),
        colors.brightWhite(
          `${parseNumberToString(toOpsEverySecond(averageRun, operations))}`,
        ),
        colors.brightYellow(totalRuns + ""),
        colors.yellow("x" + diffRatio.toFixed(2)),
      );
      console.groupEnd();

      return data;
    },
  );
}

function parseNumberToString(
  num: number,
  decimalLength = 0,
  decimalsChar = ",",
  milesChar = ".",
) {
  if (typeof num !== "number") return num;

  const fixed = num
    .toFixed(decimalLength)
    .replace(".", decimalsChar);

  let [intPart] = fixed.split(decimalsChar);
  intPart = intPart.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1" + milesChar);
  return [intPart].join(decimalsChar);
}
