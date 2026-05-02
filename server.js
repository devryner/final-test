const http = require('http');

const port = 3000;
const message = process.env.APP_MESSAGE || 'Hello, GitOps!';
const version = process.env.APP_VERSION || 'unknown';

const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Final Test — GitOps E2E</title>
  <style>
    body { font-family: -apple-system, sans-serif; text-align: center; padding: 60px; background: #0f172a; color: #f1f5f9; }
    h1 { font-size: 2.5rem; }
    .badge { display: inline-block; background: #22c55e; padding: 6px 14px; border-radius: 999px; margin-top: 16px; }
    .meta { margin-top: 24px; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>${message}</h1>
  <div class="badge">Version: ${version}</div>
  <div class="meta">
    <p>KB ACE Academy — Cloud Native 입문 최종 평가!</p>
    <p>End-to-End GitOps Pipeline (GitHub Actions → Docker Hub → Argo CD → EKS)</p>
  </div>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`APP_MESSAGE=${message}, APP_VERSION=${version}`);
});
