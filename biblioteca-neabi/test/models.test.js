const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Categoria, Participante, Artigo } = require('../models');
const Comentario = require('../models/Comentario');
const Interacao = require('../models/Interacao');

test('define as relações entre categoria, participante e artigo', () => {
  assert.equal(Categoria.associations.artigos.target, Artigo);
  assert.equal(Participante.associations.artigos.target, Artigo);
  assert.equal(Artigo.associations.categoria.target, Categoria);
  assert.equal(Artigo.associations.autor.target, Participante);
});

test('gera o slug e valida uma categoria sem acessar o banco', async () => {
  const categoria = Categoria.build({ nome: 'Educação Antirracista', cor: '#2E5D72' });
  await categoria.validate();
  assert.equal(categoria.slug, 'educacao-antirracista');
});

test('rejeita e-mail inválido de participante', async () => {
  const participante = Participante.build({ nome: 'Pessoa Teste', email: 'email-invalido' });
  await assert.rejects(() => participante.validate(), /Informe um e-mail válido/);
});

test('valida comentário com resposta aninhada', async () => {
  const comentario = new Comentario({
    artigoId: 1,
    autor: { nome: 'Leitora' },
    texto: 'Comentário válido para o acervo.',
    respostas: [{ autor: { nome: 'Equipe NEABI' }, texto: 'Resposta válida.' }],
  });
  await comentario.validate();
  assert.equal(comentario.respostas.length, 1);
});

test('rejeita tipo inválido de interação', async () => {
  const interacao = new Interacao({ artigoId: 1, tipo: 'tipo-inexistente' });
  await assert.rejects(() => interacao.validate(), /O tipo deve ser/);
});
