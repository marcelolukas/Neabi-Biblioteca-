const {
  ValidationError: SequelizeValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  ConnectionError: SequelizeConnectionError,
} = require('sequelize');
const mongoose = require('mongoose');
const HttpError = require('../utils/HttpError');
const logger = require('../utils/logger');

function formatSequelizeValidation(error) {
  return error.errors.map((item) => ({ campo: item.path, mensagem: item.message }));
}

function formatMongooseValidation(error) {
  return Object.values(error.errors).map((item) => ({ campo: item.path, mensagem: item.message }));
}

function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error);

  let status = error.status || 500;
  let message = error.message || 'Erro interno do servidor.';
  let details = error.details;

  if (error instanceof UniqueConstraintError) {
    status = 409;
    message = 'Já existe um registro com esses dados.';
    details = formatSequelizeValidation(error);
  } else if (error instanceof SequelizeValidationError) {
    status = 422;
    message = 'Os dados enviados são inválidos.';
    details = formatSequelizeValidation(error);
  } else if (error instanceof ForeignKeyConstraintError) {
    status = 409;
    message = 'A operação viola um relacionamento entre registros.';
  } else if (error instanceof SequelizeConnectionError || error.name?.startsWith('SequelizeConnection')) {
    status = 503;
    message = 'O PostgreSQL não está disponível no momento.';
  } else if (error instanceof mongoose.Error.ValidationError) {
    status = 422;
    message = 'Os dados enviados são inválidos.';
    details = formatMongooseValidation(error);
  } else if (error instanceof mongoose.Error.CastError) {
    status = 400;
    message = `O valor informado para ${error.path} é inválido.`;
  } else if (
    error.name === 'MongoServerSelectionError'
    || error.name === 'MongooseServerSelectionError'
    || (error.name === 'MongooseError' && /before initial connection|buffering timed out/i.test(error.message))
  ) {
    status = 503;
    message = 'O MongoDB não está disponível no momento.';
  } else if (error instanceof SyntaxError && error.type === 'entity.parse.failed') {
    status = 400;
    message = 'O corpo da requisição contém JSON inválido.';
  } else if (!(error instanceof HttpError) && status >= 500) {
    message = 'Erro interno do servidor.';
  }

  logger.error(error, {
    method: request.method,
    path: request.originalUrl,
    status,
  });

  const payload = { erro: { mensagem: message } };
  if (details) payload.erro.detalhes = details;
  if (process.env.NODE_ENV === 'development' && status >= 500) payload.erro.stack = error.stack;

  return response.status(status).json(payload);
}

module.exports = errorHandler;
