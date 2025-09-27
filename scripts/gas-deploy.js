import { execSync } from "node:child_process";

const DEPLOY_ID = process.env.GAS_DEPLOY_ID; // 來自 repo variable
if (!DEPLOY_ID) {
  console.error("缺少 GAS_DEPLOY_ID 環境變數");
  process.exit(1);
}

const ver = execSync("node ./scripts/gas-version.js", { encoding: "utf8" }).trim();
const desc = `ci deploy ${new Date().toISOString()}`;

execSync(`clasp deploy -i ${DEPLOY_ID} -V ${ver} -d "${desc}"`, { stdio: "inherit" });
