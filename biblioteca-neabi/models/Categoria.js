const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_sequelize');
const slugify = require('../utils/slugify');

const Categoria = sequelize.define('Categoria', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'O nome da categoria é obrigatório.' },
      len: { args: [2, 100], msg: 'O nome deve ter entre 2 e 100 caracteres.' },
    },
  },
  slug: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'O slug da categoria é obrigatório.' },
      is: { args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, msg: 'O slug possui formato inválido.' },
    },
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cor: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: { args: /^#[0-9a-f]{6}$/i, msg: 'A cor deve usar o formato hexadecimal #RRGGBB.' },
    },
  },
}, {
  tableName: 'categorias',
  hooks: {
    beforeValidate(categoria) {
      if (!categoria.slug && categoria.nome) categoria.slug = slugify(categoria.nome);
    },
  },
});

module.exports = Categoria;
