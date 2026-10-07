const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_sequelize');
const slugify = require('../utils/slugify');

const formatosPermitidos = ['artigo', 'guia', 'dossie', 'percurso', 'material'];

const Artigo = sequelize.define('Artigo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  titulo: {
    type: DataTypes.STRING(220),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O título é obrigatório.' },
      len: { args: [5, 220], msg: 'O título deve ter entre 5 e 220 caracteres.' },
    },
  },
  slug: {
    type: DataTypes.STRING(240),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'O slug do artigo é obrigatório.' },
      is: { args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, msg: 'O slug possui formato inválido.' },
    },
  },
  resumo: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O resumo é obrigatório.' },
      len: { args: [20, 1000], msg: 'O resumo deve ter entre 20 e 1000 caracteres.' },
    },
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O conteúdo é obrigatório.' },
      len: { args: [20, 50000], msg: 'O conteúdo deve ter entre 20 e 50000 caracteres.' },
    },
  },
  formato: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'artigo',
    validate: {
      isIn: { args: [formatosPermitidos], msg: `O formato deve ser: ${formatosPermitidos.join(', ')}.` },
    },
  },
  tempoLeitura: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: { args: [1], msg: 'O tempo de leitura deve ser maior que zero.' },
      max: { args: [999], msg: 'O tempo de leitura deve ser menor que 1000 minutos.' },
    },
  },
  publicado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
  dataPublicacao: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  categoriaId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'categoria_id',
  },
  autorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'autor_id',
  },
}, {
  tableName: 'artigos',
  indexes: [
    { fields: ['categoria_id'] },
    { fields: ['autor_id'] },
    { fields: ['publicado', 'data_publicacao'] },
  ],
  hooks: {
    beforeValidate(artigo) {
      if (!artigo.slug && artigo.titulo) artigo.slug = slugify(artigo.titulo);
    },
  },
});

Artigo.FORMATOS_PERMITIDOS = formatosPermitidos;

module.exports = Artigo;
