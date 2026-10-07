const { Op } = require('sequelize');
const HttpError = require('../utils/HttpError');

class RelationalCrudController {
  constructor({
    model,
    resourceName,
    allowedFields,
    searchFields = [],
    allowedSortFields = ['createdAt'],
    includeOnFind = [],
    defaultOrder = [['createdAt', 'DESC']],
  }) {
    this.model = model;
    this.resourceName = resourceName;
    this.allowedFields = allowedFields;
    this.searchFields = searchFields;
    this.allowedSortFields = allowedSortFields;
    this.includeOnFind = includeOnFind;
    this.defaultOrder = defaultOrder;

    this.list = this.list.bind(this);
    this.get = this.get.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }

  parseId(value) {
    const id = Number(value);
    if (!Number.isInteger(id) || id < 1) throw new HttpError(400, 'O identificador deve ser um inteiro positivo.');
    return id;
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

  buildWhere(query) {
    const where = {};
    if (query.q && this.searchFields.length) {
      where[Op.or] = this.searchFields.map((field) => ({
        [field]: { [Op.iLike]: `%${query.q.trim()}%` },
      }));
    }
    return where;
  }

  buildOrder(query) {
    if (!query.ordenar) return this.defaultOrder;
    if (!this.allowedSortFields.includes(query.ordenar)) {
      throw new HttpError(400, `Ordenação inválida. Use: ${this.allowedSortFields.join(', ')}.`);
    }
    const direction = String(query.direcao || 'ASC').toUpperCase();
    if (!['ASC', 'DESC'].includes(direction)) throw new HttpError(400, 'A direção deve ser ASC ou DESC.');
    return [[query.ordenar, direction]];
  }

  async findOrFail(id, options = {}) {
    const record = await this.model.findByPk(this.parseId(id), options);
    if (!record) throw new HttpError(404, `${this.resourceName} não encontrado.`);
    return record;
  }

  async list(request, response) {
    const { limit, offset } = this.parsePagination(request.query);
    const { count, rows } = await this.model.findAndCountAll({
      where: this.buildWhere(request.query),
      order: this.buildOrder(request.query),
      limit,
      offset,
      distinct: true,
    });
    response.json({
      dados: rows,
      paginacao: { total: count, limit, offset },
    });
  }

  async get(request, response) {
    const record = await this.findOrFail(request.params.id, { include: this.includeOnFind });
    response.json({ dados: record });
  }

  async create(request, response) {
    const payload = this.pickBody(request.body || {});
    const record = await this.model.create(payload);
    response.status(201).json({ dados: record });
  }

  async update(request, response) {
    const record = await this.findOrFail(request.params.id);
    const payload = this.pickBody(request.body || {});
    if (!Object.keys(payload).length) throw new HttpError(400, 'Nenhum campo válido foi enviado para atualização.');
    await record.update(payload);
    response.json({ dados: record });
  }

  async delete(request, response) {
    const record = await this.findOrFail(request.params.id);
    await record.destroy();
    response.status(204).end();
  }
}

module.exports = RelationalCrudController;
