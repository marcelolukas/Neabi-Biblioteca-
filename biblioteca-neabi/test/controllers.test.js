const { test } = require('node:test');
const assert = require('node:assert/strict');
const artigoController = require('../controllers/artigoController');
const categoriaController = require('../controllers/categoriaController');
const comentarioController = require('../controllers/comentarioController');
const interacaoController = require('../controllers/interacaoController');

test('filtra artigos por campos relacionais, formato e publicação', () => {
  const where = artigoController.buildWhere({
    categoriaId: '2',
    autorId: '3',
    formato: 'guia',
    publicado: 'true',
  });

  assert.deepEqual(where, {
    categoriaId: 2,
    autorId: 3,
    formato: 'guia',
    publicado: true,
  });
});

test('rejeita ordenação não permitida', () => {
  assert.throws(
    () => artigoController.buildOrder({ ordenar: 'campo-inexistente' }),
    /Ordenação inválida/,
  );
});

test('impede mass assignment nos controllers relacionais', () => {
  const payload = categoriaController.pickBody({
    nome: 'Categoria válida',
    cor: '#18263D',
    id: 999,
    createdAt: 'valor indevido',
  });

  assert.deepEqual(payload, { nome: 'Categoria válida', cor: '#18263D' });
});

test('monta filtros válidos para comentários e interações', () => {
  assert.deepEqual(
    comentarioController.buildFilter({ artigoId: '4', status: 'publicado' }),
    { artigoId: 4, status: 'publicado' },
  );
  assert.deepEqual(
    interacaoController.buildFilter({ artigoId: '4', participanteId: '2', tipo: 'salvamento' }),
    { artigoId: 4, participanteId: 2, tipo: 'salvamento' },
  );
});
