const DocumentCrudController = require('./DocumentCrudController');
const Interacao = require('../models/Interacao');
const { Artigo, Participante } = require('../models');
const HttpError = require('../utils/HttpError');

class InteracaoController extends DocumentCrudController {
  constructor() {
    super({
      model: Interacao,
      resourceName: 'Interação',
      allowedFields: ['artigoId', 'participanteId', 'sessaoId', 'tipo', 'detalhes', 'contexto'],
    });
    this.summary = this.summary.bind(this);
  }

  buildFilter(query) {
    const filter = {};
    if (query.artigoId !== undefined) filter.artigoId = this.parsePositiveInteger(query.artigoId, 'artigoId');
    if (query.participanteId !== undefined) filter.participanteId = this.parsePositiveInteger(query.participanteId, 'participanteId');
    if (query.tipo) {
      if (!Interacao.TIPOS_PERMITIDOS.includes(query.tipo)) throw new HttpError(400, `Tipo inválido. Use: ${Interacao.TIPOS_PERMITIDOS.join(', ')}.`);
      filter.tipo = query.tipo;
    }
    return filter;
  }

  async validateRelations(payload) {
    const articleId = this.parsePositiveInteger(payload.artigoId, 'artigoId');
    if (!await Artigo.findByPk(articleId)) throw new HttpError(422, 'O artigo informado não existe no PostgreSQL.');
    payload.artigoId = articleId;

    if (payload.participanteId !== undefined) {
      const participantId = this.parsePositiveInteger(payload.participanteId, 'participanteId');
      if (!await Participante.findByPk(participantId)) throw new HttpError(422, 'O participante informado não existe no PostgreSQL.');
      payload.participanteId = participantId;
    }
  }

  async create(request, response) {
    const payload = this.pickBody(request.body || {});
    await this.validateRelations(payload);
    const document = await Interacao.create(payload);
    response.status(201).json({ dados: document });
  }

  async update(request, response) {
    const payload = this.pickBody(request.body || {});
    const current = await this.findOrFail(request.params.id);
    await this.validateRelations({
      artigoId: payload.artigoId ?? current.artigoId,
      participanteId: payload.participanteId ?? current.participanteId,
    });
    request.body = payload;
    return super.update(request, response);
  }

  async summary(request, response) {
    const filter = this.buildFilter(request.query);
    const dados = await Interacao.aggregate([
      { $match: filter },
      { $group: { _id: '$tipo', total: { $sum: 1 }, artigos: { $addToSet: '$artigoId' } } },
      { $project: { _id: 0, tipo: '$_id', total: 1, quantidadeArtigos: { $size: '$artigos' } } },
      { $sort: { total: -1 } },
    ]);
    response.json({ dados });
  }
}

module.exports = new InteracaoController();
module.exports.InteracaoController = InteracaoController;
