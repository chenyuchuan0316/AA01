// get-refresh-token.mjs
// 用「桌面應用」OAuth 流程（loopback 127.0.0.1）取得 refresh token
// 需求：環境變數 GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET

import http from 'node:http';
import {URL} from 'node:url';
import open from 'open';
import {OAuth2Client} from 'google-auth-library';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// 僅需 Apps Script API 用到的 scope：更新內容 / 建立版本 / 建立部署
const SCOPES = [
  'https://www.googleapis.com/auth/script.projects',
  'https://www.googleapis.com/auth/script.deployments',
];

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('請先以環境變數提供 GOOGLE_CLIENT_ID 與 GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

// 啟一個臨時本機伺服器以接收 OAuth 回傳 code（loopback URI）
const server = http.createServer();
const port = await new Promise((resolve) => server.listen(0, () => resolve(server.address().port)));
const REDIRECT_URI = `http://127.0.0.1:${port}/oauth2cb`;

const oauth2 = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// 產生授權網址（一定要 offline + prompt=consent 才會給 refresh_token）
const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

console.log('\n開啟瀏覽器進行登入授權…\n', authUrl, '\n');
await open(authUrl);

// 等待 Google 回呼 ?code=...
const tokens = await new Promise((resolve, reject) => {
  server.on('request', async (req, res) => {
    try {
      const u = new URL(req.url, `http://127.0.0.1:${port}`);
      if (u.pathname !== '/oauth2cb') {
        res.writeHead(404).end();
        return;
      }
      const code = u.searchParams.get('code');
      if (!code) throw new Error('No ?code found');

      const r = await oauth2.getToken(code);
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('授權完成，可以關閉這個視窗。請回到終端機。');
      resolve(r.tokens);
    } catch (e) {
      reject(e);
    } finally {
      server.close();
    }
  });
});

// 顯示 refresh_token（帶 * 請自行保存）
if (!tokens.refresh_token) {
  console.error('\n沒有拿到 refresh_token。請確認是 Desktop app 類型，且使用 prompt=consent + access_type=offline 再試一次。');
  process.exit(1);
}

console.log('\n✅ 取得 refresh_token 成功！請複製保存到 GitHub Secrets：\n');
console.log('GAS_OAUTH_REFRESH_TOKEN=', tokens.refresh_token, '\n');
console.log('之後在 CI 請設定：GAS_CLIENT_ID / GAS_CLIENT_SECRET / GAS_OAUTH_REFRESH_TOKEN / SCRIPT_ID');
