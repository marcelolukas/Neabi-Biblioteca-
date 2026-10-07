const HttpError = require('../utils/HttpError');

function notFound(request, response, next) {
  next(new HttpError(404, `Rota não encontrada: ${request.method} ${request.originalUrl}`));
}

module.exports = notFound;
