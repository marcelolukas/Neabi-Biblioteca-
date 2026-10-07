const { isValidObjectId } = require('mongoose');
const HttpError = require('../utils/HttpError');

class DocumentCrudController {
  constructor({ model, resourceName, allowedFields, defaultSort = { createdAt: -1 } }) {
    this.model = model;
    this.resourceName = resourceName;
    this.allowedFields = allowedFields;
    this.defaultSort = defaultSort;

    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  validateId(value) {
    if (!isValidObjectId(value)) throw new HttpError(400, 'O identificador do documento é inválido.');
    return value;
  }

  parsePositiveInteger(value, fieldName) {
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) throw new HttpError(400, `${fieldName} deve ser um inteiro positivo.`);
    return number;
  }

  parsePagination(query) {
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
    const offset = Math.max(Number(query.offset) || 0, 0);
    return { limit, offset };
  }

  pickBody(body) {
    return Object.fromEntries(
      this.allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
        .map((field) => [field, body[field]]),
    );
  }

  buildFilter() {
    return {};
  }

  async findOrFail(id) {
    const document = await this.model.findById(this.validateId(id));
    if (!document) throw new HttpError(404, `${this.resourceName} não encontrado.`);
    return document;
  }

  async list(request, response) {
    const { limit, offset } = this.parsePagination(request.query);
    const filter = this.buildFilter(request.query);
    const [documents, total] = await Promise.all([
      this.model.find(filter).sort(this.defaultSort).skip(offset).limit(limit).lean(),
      this.model.countDocuments(filter),
    ]);
    response.json({ dados: documents, paginacao: { total, limit, offset } });
  }

  async get(request, response) {
    response.json({ dados: await this.findOrFail(request.params.id) });
  }

  async create(request, response) {
    const document = await this.model.create(this.pickBody(request.body || {}));
    response.status(201).json({ dados: document });
  }

  async update(request, response) {
    const payload = this.pickBody(request.body || {});
    if (!Object.keys(payload).length) throw new HttpError(400, 'Nenhum campo válido foi enviado para atualização.');
    const document = await this.model.findByIdAndUpdate(
      this.validateId(request.params.id),
      payload,
      { new: true, runValidators: true },
    );
    if (!document) throw new HttpError(404, `${this.resourceName} não encontrado.`);
    response.json({ dados: document });
  }

  async delete(request, response) {
    const document = await this.model.findByIdAndDelete(this.validateId(request.params.id));
    if (!document) throw new HttpError(404, `${this.resourceName} não encontrado.`);
    response.status(204).end();
  }
}

module.exports = DocumentCrudController;
