<<<<<<< HEAD
// gas-deploy.mjs
// 以 OAuth refresh token 呼叫 Apps Script API：updateContent → versions.create → deployments.create

import fs from 'node:fs';
import path from 'node:path';
import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const {
  SCRIPT_ID,                 // e.g. 11eWxWJyImruzOO_lTuU-VDq...
  GAS_CLIENT_ID,
  GAS_CLIENT_SECRET,
  GAS_OAUTH_REFRESH_TOKEN,
  VERSION_DESC = `CI ${new Date().toISOString()}`,
  DEPLOY_DESC  = `CI auto deploy ${new Date().toISOString()}`,
} = process.env;

if (!SCRIPT_ID)              throw new Error('缺少環境變數 SCRIPT_ID');
if (!GAS_CLIENT_ID)          throw new Error('缺少環境變數 GAS_CLIENT_ID');
if (!GAS_CLIENT_SECRET)      throw new Error('缺少環境變數 GAS_CLIENT_SECRET');
if (!GAS_OAUTH_REFRESH_TOKEN)throw new Error('缺少環境變數 GAS_OAUTH_REFRESH_TOKEN');

const oauth2 = new OAuth2Client(GAS_CLIENT_ID, GAS_CLIENT_SECRET);
oauth2.setCredentials({refresh_token: GAS_OAUTH_REFRESH_TOKEN});

const script = google.script({version: 'v1', auth: oauth2});

// 將 repo 根目錄下的 .gs / .html 與 appsscript.json 轉成 Apps Script API 的 files[]
function readFilesFromRepoRoot() {
  const cwd = process.cwd();
  const entries = fs.readdirSync(cwd, {withFileTypes: true});
  const files = [];

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const full = path.join(cwd, ent.name);
    const ext = path.extname(ent.name).toLowerCase();
    const base= path.basename(ent.name, ext);

    if (ent.name === 'appsscript.json') {
      const manifest = fs.readFileSync(full, 'utf8');
      files.push({
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify(JSON.parse(manifest)), // API 要求 JSON 字串
      });
    } else if (ext === '.gs' || ext === '.js') {
      files.push({
        name: base,
        type: 'SERVER_JS',
        source: fs.readFileSync(full, 'utf8'),
      });
    } else if (ext === '.html' || ext === '.htm') {
      files.push({
        name: base,
        type: 'HTML',
        source: fs.readFileSync(full, 'utf8'),
      });
    }
  }

  if (!files.find(f => f.name === 'appsscript' && f.type === 'JSON')) {
    throw new Error('找不到 appsscript.json（請放在 repo 根目錄，且檔名正確）');
  }
  return files;
}

(async () => {
  // 1) push 內容
  const files = readFilesFromRepoRoot();
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files },
  });
  console.log('✅ updateContent 完成（已上傳原始碼）');

  // 2) 建立版本
  const v = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: { description: VERSION_DESC },
  });
  const versionNumber = v.data.versionNumber;
  console.log('✅ versions.create 完成：version =', versionNumber);

  // 3) 建立部署
  const d = await script.projects.deployments.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      deploymentConfig: {
        versionNumber,
        manifestFileName: 'appsscript',
        description: DEPLOY_DESC,
      },
    },
  });
  console.log('✅ deployments.create 完成：deploymentId =', d.data.deploymentId);
})().catch((err) => {
  // 盡量把 API 回應 body 打出來便於排錯
  const response = err?.response?.data || err;
  console.error('DEPLOY ERR :\n', JSON.stringify(response, null, 2));
  process.exit(1);
});
=======
// gas-deploy.mjs
// 以 OAuth refresh token 呼叫 Apps Script API：updateContent → versions.create → deployments.create

import fs from 'node:fs';
import path from 'node:path';
import {google} from 'googleapis';
import {OAuth2Client} from 'google-auth-library';

const {
  SCRIPT_ID,                 // e.g. 11eWxWJyImruzOO_lTuU-VDq...
  GAS_CLIENT_ID,
  GAS_CLIENT_SECRET,
  GAS_OAUTH_REFRESH_TOKEN,
  VERSION_DESC = `CI ${new Date().toISOString()}`,
  DEPLOY_DESC  = `CI auto deploy ${new Date().toISOString()}`,
} = process.env;

if (!SCRIPT_ID)              throw new Error('缺少環境變數 SCRIPT_ID');
if (!GAS_CLIENT_ID)          throw new Error('缺少環境變數 GAS_CLIENT_ID');
if (!GAS_CLIENT_SECRET)      throw new Error('缺少環境變數 GAS_CLIENT_SECRET');
if (!GAS_OAUTH_REFRESH_TOKEN)throw new Error('缺少環境變數 GAS_OAUTH_REFRESH_TOKEN');

const oauth2 = new OAuth2Client(GAS_CLIENT_ID, GAS_CLIENT_SECRET);
oauth2.setCredentials({refresh_token: GAS_OAUTH_REFRESH_TOKEN});

const script = google.script({version: 'v1', auth: oauth2});

// 將 repo 根目錄下的 .gs / .html 與 appsscript.json 轉成 Apps Script API 的 files[]
function readFilesFromRepoRoot() {
  const cwd = process.cwd();
  const entries = fs.readdirSync(cwd, {withFileTypes: true});
  const files = [];

  for (const ent of entries) {
    if (!ent.isFile()) continue;
    const full = path.join(cwd, ent.name);
    const ext = path.extname(ent.name).toLowerCase();
    const base= path.basename(ent.name, ext);

    if (ent.name === 'appsscript.json') {
      const manifest = fs.readFileSync(full, 'utf8');
      files.push({
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify(JSON.parse(manifest)), // API 要求 JSON 字串
      });
    } else if (ext === '.gs' || ext === '.js') {
      files.push({
        name: base,
        type: 'SERVER_JS',
        source: fs.readFileSync(full, 'utf8'),
      });
    } else if (ext === '.html' || ext === '.htm') {
      files.push({
        name: base,
        type: 'HTML',
        source: fs.readFileSync(full, 'utf8'),
      });
    }
  }

  if (!files.find(f => f.name === 'appsscript' && f.type === 'JSON')) {
    throw new Error('找不到 appsscript.json（請放在 repo 根目錄，且檔名正確）');
  }
  return files;
}

(async () => {
  // 1) push 內容
  const files = readFilesFromRepoRoot();
  await script.projects.updateContent({
    scriptId: SCRIPT_ID,
    requestBody: { files },
  });
  console.log('✅ updateContent 完成（已上傳原始碼）');

  // 2) 建立版本
  const v = await script.projects.versions.create({
    scriptId: SCRIPT_ID,
    requestBody: { description: VERSION_DESC },
  });
  const versionNumber = v.data.versionNumber;
  console.log('✅ versions.create 完成：version =', versionNumber);

  // 3) 建立部署
  const d = await script.projects.deployments.create({
    scriptId: SCRIPT_ID,
    requestBody: {
      deploymentConfig: {
        versionNumber,
        manifestFileName: 'appsscript',
        description: DEPLOY_DESC,
      },
    },
  });
  console.log('✅ deployments.create 完成：deploymentId =', d.data.deploymentId);
})().catch((err) => {
  // 盡量把 API 回應 body 打出來便於排錯
  const response = err?.response?.data || err;
  console.error('DEPLOY ERR :\n', JSON.stringify(response, null, 2));
  process.exit(1);
});
>>>>>>> cc2d3f1 (Add deployment script)
