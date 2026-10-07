const DocumentCrudController = require('./DocumentCrudController');
const Comentario = require('../models/Comentario');
const { Artigo } = require('../models');
const HttpError = require('../utils/HttpError');

class ComentarioController extends DocumentCrudController {
  constructor() {
    super({
      model: Comentario,
      resourceName: 'Comentário',
      allowedFields: ['artigoId', 'autor', 'texto', 'status', 'reacoes'],
    });
    this.addReply = this.addReply.bind(this);
    this.react = this.react.bind(this);
  }

  buildFilter(query) {
    const filter = {};
    if (query.artigoId !== undefined) filter.artigoId = this.parsePositiveInteger(query.artigoId, 'artigoId');
    if (query.status) {
      if (!['publicado', 'moderacao', 'oculto'].includes(query.status)) throw new HttpError(400, 'Status de comentário inválido.');
      filter.status = query.status;
    }
    return filter;
  }

  async ensureArticleExists(artigoId) {
    const id = this.parsePositiveInteger(artigoId, 'artigoId');
    if (!await Artigo.findByPk(id)) throw new HttpError(422, 'O artigo informado não existe no PostgreSQL.');
    return id;
  }

  async create(request, response) {
    const payload = this.pickBody(request.body || {});
    payload.artigoId = await this.ensureArticleExists(payload.artigoId);
    const document = await Comentario.create(payload);
    response.status(201).json({ dados: document });
  }

  async update(request, response) {
    const payload = this.pickBody(request.body || {});
    if (payload.artigoId !== undefined) payload.artigoId = await this.ensureArticleExists(payload.artigoId);
    request.body = payload;
    return super.update(request, response);
  }

  async addReply(request, response) {
    const comentario = await this.findOrFail(request.params.id);
    comentario.respostas.push({
      autor: request.body?.autor,
      texto: request.body?.texto,
    });
    await comentario.save();
    response.status(201).json({ dados: comentario });
  }

  async react(request, response) {
    const tipo = request.body?.tipo;
    if (!['apoio', 'reflexao'].includes(tipo)) throw new HttpError(400, 'A reação deve ser apoio ou reflexao.');
    const comentario = await this.findOrFail(request.params.id);
    comentario.reacoes[tipo] += 1;
    await comentario.save();
    response.json({ dados: comentario });
  }
}

module.exports = new ComentarioController();
module.exports.ComentarioController = ComentarioController;
