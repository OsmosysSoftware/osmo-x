const http = require('http');

const PORT = process.env.PORT || 4000;
const MAX_BODY_BYTES = 1024 * 1024; // 1mb

function parseFailCount(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : fallback;
}

function parseFailStatus(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 100 && n <= 599 ? n : fallback;
}

// Number of times to fail (per notification id) before returning success.
let FAIL_COUNT = parseFailCount(process.env.FAIL_COUNT, 0);
let FAIL_STATUS = parseFailStatus(process.env.FAIL_STATUS, 500);

const attempts = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload too large'), { statusCode: 413 }));
        req.destroy();
        return;
      }
      raw += chunk;
    });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

function json(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/status') {
      return json(res, 200, { failCount: FAIL_COUNT, failStatus: FAIL_STATUS, attempts: Object.fromEntries(attempts) });
    }

    if (req.method === 'POST' && req.url === '/reset') {
      attempts.clear();
      return json(res, 200, { reset: true });
    }

    if (req.method === 'POST' && req.url === '/configure') {
      const raw = await readBody(req);
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        return json(res, 400, { error: 'invalid JSON body' });
      }
      if (body.failCount !== undefined) FAIL_COUNT = parseFailCount(body.failCount, FAIL_COUNT);
      if (body.failStatus !== undefined) FAIL_STATUS = parseFailStatus(body.failStatus, FAIL_STATUS);
      attempts.clear();
      console.log(`  -> reconfigured: FAIL_COUNT=${FAIL_COUNT} FAIL_STATUS=${FAIL_STATUS}`);
      return json(res, 200, { failCount: FAIL_COUNT, failStatus: FAIL_STATUS });
    }

    const raw = await readBody(req);
    let payload = {};
    try {
      payload = raw ? JSON.parse(raw) : {};
    } catch {
      return json(res, 400, { error: 'invalid JSON body' });
    }

    const id = payload.id ?? 'unknown';
    const count = (attempts.get(id) || 0) + 1;
    attempts.set(id, count);

    console.log(`[${new Date().toISOString()}] notification ${id} attempt ${count}`, payload);

    if (count <= FAIL_COUNT) {
      console.log(`  -> failing (attempt ${count}/${FAIL_COUNT}), status ${FAIL_STATUS}`);
      return json(res, FAIL_STATUS, { ok: false, attempt: count });
    }

    console.log(`  -> succeeding (attempt ${count})`);
    return json(res, 200, { ok: true, attempt: count });
  } catch (error) {
    if (error.statusCode === 413) {
      return json(res, 413, { error: 'payload too large' });
    }
    console.error('unexpected error', error);
    return json(res, 500, { error: 'internal error' });
  }
});

server.listen(PORT, () => {
  console.log(`webhook-test-receiver listening on :${PORT}`);
  console.log(`FAIL_COUNT=${FAIL_COUNT} FAIL_STATUS=${FAIL_STATUS}`);
  console.log('GET /status to inspect attempts, POST /reset to clear');
});
