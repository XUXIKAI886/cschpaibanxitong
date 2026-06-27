function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

function createHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function parseApiPath(url) {
  const parsed = new URL(url, 'http://localhost');
  return parsed.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

module.exports = {
  sendJson,
  createHttpError,
  parseApiPath,
  readJsonBody
};
