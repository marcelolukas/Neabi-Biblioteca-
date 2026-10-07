const { Schema, model, models } = require('mongoose');

const tiposPermitidos = ['visualizacao', 'salvamento', 'compartilhamento', 'busca'];

const interacaoSchema = new Schema({
  artigoId: {
    type: Number,
    required: [true, 'O artigoId é obrigatório.'],
    min: [1, 'O artigoId deve ser um inteiro positivo.'],
    index: true,
  },
  participanteId: {
    type: Number,
    min: [1, 'O participanteId deve ser um inteiro positivo.'],
    index: true,
  },
  sessaoId: {
    type: String,
    trim: true,
    maxlength: [120, 'O sessaoId deve ter no máximo 120 caracteres.'],
  },
  tipo: {
    type: String,
    required: [true, 'O tipo da interação é obrigatório.'],
    enum: {
      values: tiposPermitidos,
      message: `O tipo deve ser: ${tiposPermitidos.join(', ')}.`,
    },
    index: true,
  },
  detalhes: {
    type: Schema.Types.Mixed,
    default: {},
  },
  contexto: {
    origem: { type: String, trim: true, maxlength: 250 },
    dispositivo: { type: String, trim: true, maxlength: 80 },
  },
}, {
  timestamps: true,
  versionKey: false,
  collection: 'interacoes',
});

interacaoSchema.index({ artigoId: 1, tipo: 1, createdAt: -1 });

const Interacao = models.Interacao || model('Interacao', interacaoSchema);
Interacao.TIPOS_PERMITIDOS = tiposPermitidos;

module.exports = Interacao;
