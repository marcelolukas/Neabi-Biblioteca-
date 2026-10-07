const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_sequelize');

const papeisPermitidos = ['estudante', 'docente', 'comunidade', 'administrador'];

const Participante = sequelize.define('Participante', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nome: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'O nome do participante é obrigatório.' },
      len: { args: [2, 120], msg: 'O nome deve ter entre 2 e 120 caracteres.' },
    },
  },
  email: {
    type: DataTypes.STRING(180),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'O e-mail é obrigatório.' },
      isEmail: { msg: 'Informe um e-mail válido.' },
    },
  },
  papel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'comunidade',
    validate: {
      isIn: { args: [papeisPermitidos], msg: `O papel deve ser: ${papeisPermitidos.join(', ')}.` },
    },
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'participantes',
  hooks: {
    beforeValidate(participante) {
      if (participante.email) participante.email = participante.email.trim().toLowerCase();
    },
  },
});

Participante.PAPEIS_PERMITIDOS = papeisPermitidos;

module.exports = Participante;
