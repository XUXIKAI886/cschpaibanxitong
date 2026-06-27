const { sendJson, parseApiPath, readJsonBody } = require('./http');

async function handleApiRequest(req, res, dependencies = {}) {
  try {
    const parts = parseApiPath(req.url);
    const companyRepository = dependencies.companyRepository;

    if (req.method === 'GET' && parts.length === 1 && parts[0] === 'health') {
      sendJson(res, 200, { status: 'ok', database: 'dasaochupaiban' });
      return;
    }

    if (parts[0] === 'companies' && companyRepository) {
      if (req.method === 'GET' && parts.length === 1) {
        sendJson(res, 200, await companyRepository.listCompanies());
        return;
      }
      if (req.method === 'GET' && parts.length === 2) {
        const company = await companyRepository.getCompany(parts[1]);
        if (!company) {
          sendJson(res, 404, { error: 'company_not_found', message: `Company ${parts[1]} was not found` });
          return;
        }
        sendJson(res, 200, company);
        return;
      }
      if (req.method === 'POST' && parts.length === 3 && parts[2] === 'employees') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addEmployee(parts[1], body.name));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 4 && parts[2] === 'employees') {
        sendJson(res, 200, await companyRepository.deleteEmployee(parts[1], parts[3]));
        return;
      }
      if (req.method === 'POST' && parts.length === 3 && parts[2] === 'areas') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addArea(parts[1], body.name, body.firstTaskName));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 4 && parts[2] === 'areas') {
        sendJson(res, 200, await companyRepository.deleteArea(parts[1], parts[3]));
        return;
      }
      if (req.method === 'POST' && parts.length === 5 && parts[2] === 'areas' && parts[4] === 'tasks') {
        const body = await readJsonBody(req);
        sendJson(res, 200, await companyRepository.addTask(parts[1], parts[3], body.name));
        return;
      }
      if (req.method === 'DELETE' && parts.length === 6 && parts[2] === 'areas' && parts[4] === 'tasks') {
        sendJson(res, 200, await companyRepository.deleteTask(parts[1], parts[3], parts[5]));
        return;
      }
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
