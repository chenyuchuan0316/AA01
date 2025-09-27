#!/usr/bin/env node
// get-refresh-token.mjs
// 互動流程：啟動本機 HTTP server，指示使用者於瀏覽器授權後自動接收 code

import http from 'node:http';
import process from 'node:process';
import { URL } from 'node:url';
import { google } from 'googleapis';

const {
  GAS_CLIENT_ID,
  GAS_CLIENT_SECRET,
  GAS_OAUTH_SCOPES,
  GAS_OAUTH_REDIRECT_PORT
} = process.env;

if(!GAS_CLIENT_ID){
  console.error('❌ 請先以環境變數 GAS_CLIENT_ID 指定 OAuth 2.0 Client ID');
  process.exit(1);
}

if(!GAS_CLIENT_SECRET){
  console.error('❌ 請先以環境變數 GAS_CLIENT_SECRET 指定 OAuth 2.0 Client Secret');
  process.exit(1);
}

const port = Number(GAS_OAUTH_REDIRECT_PORT || 53682);
if(Number.isNaN(port) || port <= 0){
  console.error('❌ GAS_OAUTH_REDIRECT_PORT 需為正整數埠號');
  process.exit(1);
}

const scopes = (GAS_OAUTH_SCOPES || [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments'
].join(' '))
  .split(/[,\s]+/)
  .map(scope => scope.trim())
  .filter(Boolean);

if(!scopes.length){
  console.error('❌ 至少指定一個 OAuth scope');
  process.exit(1);
}

const redirectUri = `http://localhost:${port}/oauth2callback`;
const oauth2 = new google.auth.OAuth2(GAS_CLIENT_ID, GAS_CLIENT_SECRET, redirectUri);

const state = Math.random().toString(36).slice(2, 12);
const authorizeUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes,
  state
});

console.log('==============================================');
console.log('  Google OAuth 授權流程（取得 refresh token）');
console.log('==============================================');
console.log('\n1. 請於瀏覽器開啟以下 URL 並登入執行帳號：\n');
console.log(authorizeUrl + '\n');
console.log('2. 核准所有要求的權限。授權完成後畫面會顯示 "Authorization complete"。');
console.log('3. 本程式將在瀏覽器回呼後自動印出 refresh_token。');
console.log(`\n⚠️ 若瀏覽器顯示連線失敗，請確認本機 port ${port} 未被佔用。`);

const server = http.createServer(async (req, res) => {
  try{
    const url = new URL(req.url, redirectUri);
    if(url.pathname !== '/oauth2callback'){
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const returnedState = url.searchParams.get('state');
    if(returnedState !== state){
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Invalid state');
      return;
    }

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if(error){
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Authorization failed: ${error}`);
      console.error('❌ 授權失敗：', error);
      process.exitCode = 1;
      server.close();
      return;
    }

    if(!code){
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Missing authorization code');
      console.error('❌ 未收到授權 code');
      process.exitCode = 1;
      server.close();
      return;
    }

    const { tokens } = await oauth2.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Authorization complete. You may close this tab.');

    console.log('\n🎉 取得成功！請妥善保存以下 refresh_token：\n');
    console.log(tokens.refresh_token || '(未取得 refresh_token，請檢查 OAuth 設定)');
    console.log('\n建議將 refresh_token 複製到安全的 Secrets 管理工具，例如 GitHub Actions Secrets。');

    server.close();
  }catch(err){
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error');
    console.error('❌ 發生錯誤：', err?.message || err);
    process.exitCode = 1;
    server.close();
  }
});

server.listen(port, () => {
  console.log(`\n正在本機監聽 http://localhost:${port}/oauth2callback 等候授權回呼...`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 已中止流程。');
  server.close(() => process.exit(1));
});
