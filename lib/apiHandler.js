const { sendJson, parseApiPath } = require('./http');

async function handleApiRequest(req, res, dependencies = {}) {
  try {
    const parts = parseApiPath(req.url);

    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'health') {
      sendJson(res, 200, { status: 'ok', database: 'dasaochupaiban' });
      return;
    }

    sendJson(res, 404, { error: 'not_found', message: 'API route not found' });
  } catch (error) {
    sendJson(res, error.statusCode || 500, {
      error: error.code || 'internal_error',
      message: error.message || 'Internal server error'
    });
  }
}

module.exports = { handleApiRequest };
