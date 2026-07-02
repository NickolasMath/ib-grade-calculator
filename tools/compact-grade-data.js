const fs = require("fs");
const vm = require("vm");

const inputPath = "grade-data.js";
const outputPath = "grade-data.min.js";
const source = fs.readFileSync(inputPath, "utf8");
const context = { window: {} };

vm.runInNewContext(source, context);

const data = context.window.IB_GRADE_BOUNDARIES;
const compact = data.map(({ option, level, timezone, max, bounds, components }) => ({
  option,
  level,
  timezone,
  max,
  bounds,
  components: (components || []).map(({ name, max: componentMax }) => ({
    name,
    max: componentMax,
  })),
}));
const output = `window.IB_GRADE_BOUNDARIES=${JSON.stringify(compact)};\n`;

fs.writeFileSync(outputPath, output);

console.log(
  JSON.stringify({
    entries: data.length,
    originalBytes: Buffer.byteLength(source),
    compactBytes: Buffer.byteLength(output),
    reductionPercent: Number(
      ((1 - Buffer.byteLength(output) / Buffer.byteLength(source)) * 100).toFixed(1),
    ),
  }),
);
