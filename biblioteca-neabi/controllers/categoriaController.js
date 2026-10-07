const RelationalCrudController = require('./RelationalCrudController');
const { Categoria, Artigo } = require('../models');

module.exports = new RelationalCrudController({
  model: Categoria,
  resourceName: 'Categoria',
  allowedFields: ['nome', 'slug', 'descricao', 'cor'],
  searchFields: ['nome', 'descricao'],
  allowedSortFields: ['nome', 'createdAt'],
  defaultOrder: [['nome', 'ASC']],
  includeOnFind: [{
    model: Artigo,
    as: 'artigos',
    attributes: ['id', 'titulo', 'slug', 'formato', 'publicado'],
  }],
});
