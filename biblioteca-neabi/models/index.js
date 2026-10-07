const Categoria = require('./Categoria');
const Participante = require('./Participante');
const Artigo = require('./Artigo');

Categoria.hasMany(Artigo, {
  as: 'artigos',
  foreignKey: 'categoriaId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Artigo.belongsTo(Categoria, {
  as: 'categoria',
  foreignKey: 'categoriaId',
});

Participante.hasMany(Artigo, {
  as: 'artigos',
  foreignKey: 'autorId',
  onDelete: 'RESTRICT',
  onUpdate: 'CASCADE',
});

Artigo.belongsTo(Participante, {
  as: 'autor',
  foreignKey: 'autorId',
});

module.exports = {
  Categoria,
  Participante,
  Artigo,
};
