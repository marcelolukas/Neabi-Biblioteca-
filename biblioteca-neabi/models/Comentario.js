const { Schema, model, models } = require('mongoose');

const autorSchema = new Schema({
  nome: {
    type: String,
    required: [true, 'O nome do autor é obrigatório.'],
    trim: true,
    minlength: [2, 'O nome deve ter ao menos 2 caracteres.'],
    maxlength: [120, 'O nome deve ter no máximo 120 caracteres.'],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 180,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Informe um e-mail válido.'],
  },
}, { _id: false });

const respostaSchema = new Schema({
  autor: {
    type: autorSchema,
    required: true,
  },
  texto: {
    type: String,
    required: [true, 'O texto da resposta é obrigatório.'],
    trim: true,
    minlength: [3, 'A resposta deve ter ao menos 3 caracteres.'],
    maxlength: [1000, 'A resposta deve ter no máximo 1000 caracteres.'],
  },
  criadoEm: {
    type: Date,
    default: Date.now,
  },
});

const comentarioSchema = new Schema({
  artigoId: {
    type: Number,
    required: [true, 'O artigoId é obrigatório.'],
    min: [1, 'O artigoId deve ser um inteiro positivo.'],
    index: true,
  },
  autor: {
    type: autorSchema,
    required: true,
  },
  texto: {
    type: String,
    required: [true, 'O texto do comentário é obrigatório.'],
    trim: true,
    minlength: [3, 'O comentário deve ter ao menos 3 caracteres.'],
    maxlength: [2000, 'O comentário deve ter no máximo 2000 caracteres.'],
  },
  respostas: {
    type: [respostaSchema],
    default: [],
  },
  reacoes: {
    apoio: { type: Number, min: 0, default: 0 },
    reflexao: { type: Number, min: 0, default: 0 },
  },
  status: {
    type: String,
    enum: {
      values: ['publicado', 'moderacao', 'oculto'],
      message: 'O status deve ser publicado, moderacao ou oculto.',
    },
    default: 'publicado',
    index: true,
  },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'comentarios',
});

comentarioSchema.index({ artigoId: 1, createdAt: -1 });

module.exports = models.Comentario || model('Comentario', comentarioSchema);
