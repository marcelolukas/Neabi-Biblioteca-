const RelationalCrudController = require('./RelationalCrudController');
const { Artigo, Categoria, Participante } = require('../models');
const Comentario = require('../models/Comentario');
const Interacao = require('../models/Interacao');
const HttpError = require('../utils/HttpError');
const logger = require('../utils/logger');

const artigoIncludes = [
  { model: Categoria, as: 'categoria', attributes: ['id', 'nome', 'slug', 'cor'] },
  { model: Participante, as: 'autor', attributes: ['id', 'nome', 'papel'] },
];

class ArtigoController extends RelationalCrudController {
  constructor() {
    super({
      model: Artigo,
      resourceName: 'Artigo',
      allowedFields: ['titulo', 'slug', 'resumo', 'conteudo', 'formato', 'tempoLeitura', 'publicado', 'dataPublicacao', 'categoriaId', 'autorId'],
      searchFields: ['titulo', 'resumo', 'conteudo'],
      allowedSortFields: ['titulo', 'dataPublicacao', 'tempoLeitura', 'createdAt'],
      defaultOrder: [['dataPublicacao', 'DESC']],
      includeOnFind: artigoIncludes,
    });

    this.getComplete = this.getComplete.bind(this);
  }

  buildWhere(query) {
    const where = super.buildWhere(query);
    for (const field of ['categoriaId', 'autorId']) {
      if (query[field] !== undefined) where[field] = this.parseId(query[field]);
    }
    if (query.formato) {
      if (!Artigo.FORMATOS_PERMITIDOS.includes(query.formato)) {
        throw new HttpError(400, `Formato inválido. Use: ${Artigo.FORMATOS_PERMITIDOS.join(', ')}.`);
      }
      where.formato = query.formato;
    }
    if (query.publicado !== undefined) {
      if (!['true', 'false'].includes(String(query.publicado))) throw new HttpError(400, 'O filtro publicado deve ser true ou false.');
      where.publicado = String(query.publicado) === 'true';
    }
    return where;
  }

  async validateRelations(payload) {
    const checks = [];
    if (payload.categoriaId !== undefined) checks.push(Categoria.findByPk(this.parseId(payload.categoriaId)).then((item) => ['categoria', item]));
    if (payload.autorId !== undefined) checks.push(Participante.findByPk(this.parseId(payload.autorId)).then((item) => ['autor', item]));
    const results = await Promise.all(checks);
    for (const [name, record] of results) {
      if (!record) throw new HttpError(422, `O ${name} informado não existe.`);
    }
  }

  async create(request, response) {
    const payload = this.pickBody(request.body || {});
    await this.validateRelations(payload);
    const record = await Artigo.create(payload);
    response.status(201).json({ dados: await this.findOrFail(record.id, { include: artigoIncludes }) });
  }

  async update(request, response) {
    const record = await this.findOrFail(request.params.id);
    const payload = this.pickBody(request.body || {});
    if (!Object.keys(payload).length) throw new HttpError(400, 'Nenhum campo válido foi enviado para atualização.');
    await this.validateRelations(payload);
    await record.update(payload);
    response.json({ dados: await this.findOrFail(record.id, { include: artigoIncludes }) });
  }

  async getComplete(request, response) {
    const artigo = await this.findOrFail(request.params.id, { include: artigoIncludes });
    const comentarios = await Comentario.find({ artigoId: artigo.id, status: 'publicado' })
      .sort({ createdAt: -1 })
      .lean();
    response.json({ dados: { ...artigo.toJSON(), comentarios } });
  }

  async delete(request, response) {
    const artigo = await this.findOrFail(request.params.id);
    await artigo.destroy();
    const cleanup = await Promise.allSettled([
      Comentario.deleteMany({ artigoId: artigo.id }),
      Interacao.deleteMany({ artigoId: artigo.id }),
    ]);
    cleanup.filter((result) => result.status === 'rejected').forEach((result) => {
      logger.error(result.reason, { operation: 'mongo_cleanup', artigoId: artigo.id });
    });
    response.status(204).end();
  }
}

module.exports = new ArtigoController();
module.exports.ArtigoController = ArtigoController;
