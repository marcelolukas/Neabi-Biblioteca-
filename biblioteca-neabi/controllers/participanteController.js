const RelationalCrudController = require('./RelationalCrudController');
const { Participante, Artigo } = require('../models');

module.exports = new RelationalCrudController({
  model: Participante,
  resourceName: 'Participante',
  allowedFields: ['nome', 'email', 'papel', 'bio', 'ativo'],
  searchFields: ['nome', 'email', 'bio'],
  allowedSortFields: ['nome', 'email', 'papel', 'createdAt'],
  defaultOrder: [['nome', 'ASC']],
  includeOnFind: [{
    model: Artigo,
    as: 'artigos',
    attributes: ['id', 'titulo', 'slug', 'formato', 'publicado'],
  }],
});
