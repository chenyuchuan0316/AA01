import { execSync } from "node:child_process";

const desc = `ci build ${new Date().toISOString()}`;
const out = execSync(`clasp version "${desc}"`, { encoding: "utf8" });
const m = out.match(/version (\d+)/);
if (!m) {
  console.error("無法解析版本號，clasp 輸出:\n" + out);
  process.exit(1);
}
const ver = m[1];
console.log(ver); // 印純版本號，後續腳本直接取用
