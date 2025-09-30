#!/usr/bin/env node
// gas-deploy.mjs
// 使用 End-User OAuth（Client ID/Secret + Refresh Token）呼叫 Apps Script API：
// 1) projects.updateContent  2) projects.versions.create  3) projects.deployments.(update|create)

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { google } from 'googleapis';

// -----------------------------
// 讀取必要環境變數（由 GitHub Secrets 注入）
// -----------------------------
const {
  SCRIPT_ID,                  // Apps Script 專案 Script ID
  GAS_CLIENT_ID,              // OAuth 2.0 Client ID
  GAS_CLIENT_SECRET,          // OAuth 2.0 Client Secret
  GAS_OAUTH_REFRESH_TOKEN,    // 以 get-refresh-token.mjs 取得的 refresh_token
  VERSION_DESC = `CI ${new Date().toISOString()}`,
  DEPLOY_DESC  = `CI auto deploy ${new Date().toISOString()}`,
  DEPLOYMENT_ID,              // （可選）若指定則直接更新該 deploymentId
} = process.env;

function need(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ 缺少環境變數 ${name}。請在 GitHub Secrets 設定：${name}`);
    process.exit(1);
  }
  return value;
}
const scriptId = need('SCRIPT_ID');

const SCOPES = Object.freeze([
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
]);

function decodeServiceAccountJson(raw) {
  const trimmed = raw.trim();
  const text = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(
      `GAS_SERVICE_ACCOUNT_JSON 不是有效 JSON：${error.message}`
    );
  }
}

async function resolveAuthClient() {
  if (process.env.GAS_SERVICE_ACCOUNT_JSON) {
    const credentials = decodeServiceAccountJson(
      process.env.GAS_SERVICE_ACCOUNT_JSON
    );
    const client = google.auth.fromJSON(credentials);
    client.scopes = SCOPES;
    console.log('🔑 使用 Service Account JSON（GAS_SERVICE_ACCOUNT_JSON）。');
    return client;
  }

  const useAdc =
    process.env.GAS_USE_ADC === 'true' ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.GOOGLE_GHA_WORKLOAD_IDENTITY_PROVIDER;
  if (useAdc) {
    console.log('🔑 使用 Application Default Credentials (ADC)。');
    return google.auth.getClient({ scopes: SCOPES });
  }

  const clientId = need('GAS_CLIENT_ID');
  const clientSecret = need('GAS_CLIENT_SECRET');
  const refreshToken = need('GAS_OAUTH_REFRESH_TOKEN');

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  console.log('🔑 使用 OAuth2 Refresh Token（GAS_CLIENT_ID/GAS_CLIENT_SECRET）。');
  return oauth2;
}

let scriptClientPromise;
async function getScriptClient() {
  if (!scriptClientPromise) {
    scriptClientPromise = resolveAuthClient().then(auth =>
      google.script({ version: 'v1', auth })
    );
  }
  return scriptClientPromise;
}

// -----------------------------
// 從 repo 根目錄收集檔案 → Apps Script API 的 files[]
//   - 只掃描根目錄（避免把 node_modules、docs 等雜檔帶進去）
//   - 允許：.gs / .js → SERVER_JS； .html → HTML； appsscript.json → JSON（名為 "appsscript"）
//   - 檢查同名衝突（Apps Script 檔名需唯一）
// -----------------------------
function buildFilesFromRepoRoot() {
  const cwd = process.cwd();
  const entries = fs.readdirSync(cwd, { withFileTypes: true });

  const files = [];
  const usedNames = new Map(); // name → ext/type，檢查重名

  for (const ent of entries) {
    if (!ent.isFile()) continue;

    const full = path.join(cwd, ent.name);
    const ext = path.extname(ent.name).toLowerCase();
    const base = path.basename(ent.name, ext);

    if (ent.name === 'appsscript.json') {
      const manifestText = fs.readFileSync(full, 'utf8').trim();
      let manifestObj;
      try {
        manifestObj = JSON.parse(manifestText);
      } catch (e) {
        throw new Error(`appsscript.json 不是有效 JSON：${e.message}`);
      }
      // manifest 在 API 中必須叫 "appsscript"、type=JSON，source 為 JSON 字串
      files.push({
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify(manifestObj),
      });
      continue;
    }

    if (ext === '.gs' || ext === '.js') {
      if (usedNames.has(base)) {
        throw new Error(`檔名衝突：${base}（Apps Script 同一專案內檔名必須唯一）`);
      }
      usedNames.set(base, 'SERVER_JS');
      files.push({
        name: base,
        type: 'SERVER_JS',
        source: fs.readFileSync(full, 'utf8'),
      });
      continue;
    }

    if (ext === '.html' || ext === '.htm') {
      if (usedNames.has(base)) {
        throw new Error(`檔名衝突：${base}（Apps Script 同一專案內檔名必須唯一）`);
      }
      usedNames.set(base, 'HTML');
      files.push({
        name: base,
        type: 'HTML',
        source: fs.readFileSync(full, 'utf8'),
      });
      continue;
    }

    // 其他副檔名全部忽略（如 .csv / .xlsx / .md / .yml / lock 檔等）
  }

  // 確認 manifest 存在
  const hasManifest = files.some(f => f.type === 'JSON' && f.name === 'appsscript');
  if (!hasManifest) {
    throw new Error('找不到 appsscript.json（請放在 repo 根目錄，檔名須正確）');
  }

  // 至少要有一個 SERVER_JS 或 HTML
  const hasCode = files.some(f => f.type === 'SERVER_JS' || f.type === 'HTML');
  if (!hasCode) {
    console.warn('⚠️ 找不到任何 .gs/.js/.html；仍會只更新 manifest。');
  }

  return files;
}

// -----------------------------
// Utility：擷取 Web App URL（若有）
// -----------------------------
function tryGetWebAppUrl(deployment) {
  const eps = deployment?.entryPoints || [];
  for (const ep of eps) {
    if (ep.entryPointType === 'WEB_APP' && ep.webApp?.url) {
      return ep.webApp.url;
    }
  }
  return null;
}

// -----------------------------
// 主流程
// -----------------------------
(async () => {
  const script = await getScriptClient();

  // 1) 上傳原始碼
  const files = buildFilesFromRepoRoot();
  await script.projects.updateContent({
    scriptId,
    requestBody: { files },
  });
  console.log('✅ updateContent 完成（已上傳原始碼）');

  // 2) 建立版本
  const v = await script.projects.versions.create({
    scriptId,
    requestBody: { description: VERSION_DESC },
  });
  const versionNumber = v.data.versionNumber;
  if (!versionNumber) throw new Error('versions.create 失敗：未取得 versionNumber');
  console.log('✅ versions.create 完成：version =', versionNumber);

  // 3) 判斷要 update 還是 create
  let deploymentIdToUse = DEPLOYMENT_ID?.trim() || null;

  if (!deploymentIdToUse) {
    // 沒指定就查看既有部署，抓「最近更新」那筆
    const list = await script.projects.deployments.list({ scriptId });
    const deployments = list.data.deployments || [];
    const head = deployments
      .filter(d => d.deploymentId)
      .sort((a, b) => new Date(b.updateTime || 0) - new Date(a.updateTime || 0))[0];

    if (head?.deploymentId) {
      deploymentIdToUse = head.deploymentId;
      console.log(`🔎 偵測到既有部署（將 update）：${deploymentIdToUse}`);
    } else {
      console.log('🔎 找不到既有部署（將 create，會產生新的 deploymentId 與可能的新 URL）');
    }
  } else {
    console.log(`🔧 你指定了 DEPLOYMENT_ID=${deploymentIdToUse}，將直接 update 該部署`);
  }

  // 4) 執行部署（update 優先；否則 create）
  let finalDeploymentId = null;
  let webAppUrl = null;

  if (deploymentIdToUse) {
    // update：body 放在 deploymentConfig
    const upd = await script.projects.deployments.update({
      scriptId,
      deploymentId: deploymentIdToUse,
      requestBody: {
        deploymentConfig: {
          versionNumber,
          manifestFileName: 'appsscript', // 注意：這裡不是 appsscript.json
          description: DEPLOY_DESC,
        },
      },
    });
    finalDeploymentId = upd.data.deploymentId || deploymentIdToUse;

    // 取回 URL（若為 Web App）
    const got = await script.projects.deployments.get({
      scriptId,
      deploymentId: finalDeploymentId,
    });
    webAppUrl = tryGetWebAppUrl(got.data);

    console.log('✅ deployments.update 完成（沿用原部署）');
  } else {
    // create：扁平欄位（不要放 deploymentConfig）
    const crt = await script.projects.deployments.create({
      scriptId,
      requestBody: {
        versionNumber,
        manifestFileName: 'appsscript', // 注意：這裡不是 appsscript.json
        description: DEPLOY_DESC,
      },
    });
    finalDeploymentId = crt.data.deploymentId;

    // 取回 URL（若為 Web App）
    const got = await script.projects.deployments.get({
      scriptId,
      deploymentId: finalDeploymentId,
    });
    webAppUrl = tryGetWebAppUrl(got.data);

    console.log('✅ deployments.create 完成（新部署）');
  }

  console.log('📌 deploymentId =', finalDeploymentId || '(未知)');
  if (webAppUrl) {
    console.log('🌐 Web App URL =', webAppUrl);
  } else {
    console.log('ℹ️ 此部署沒有 Web App 進入點（Add-on / Library 等情境屬正常）');
  }
})().catch(err => {
  // 盡量輸出 API 詳細錯誤
  const data = err?.response?.data || err;
  console.error('❌ DEPLOY ERROR\n', JSON.stringify(data, null, 2));
  process.exit(1);
});
