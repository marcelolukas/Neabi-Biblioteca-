const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('entrega a interface principal do acervo', async () => {
  const response = await fetch(baseUrl);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /Biblioteca \| NEABI Tia Ciata/);
  assert.equal((html.match(/class="catalog-item/g) || []).length, 6);
  assert.match(html, /id="catalog-search"/);
  assert.match(html, /logo-neabi-tia-ciata\.png/);
  assert.match(html, /Textos escritos por quem vive a universidade/);
});

test('entrega os recursos estáticos', async () => {
  const responses = await Promise.all([
    fetch(`${baseUrl}/styles.css`),
    fetch(`${baseUrl}/script.js`),
    fetch(`${baseUrl}/assets/logo-neabi-tia-ciata.png`),
  ]);

  assert.deepEqual(responses.map((response) => response.status), [200, 200, 200]);
  assert.match(responses[0].headers.get('content-type'), /text\/css/);
  assert.match(responses[1].headers.get('content-type'), /javascript/);
  assert.match(responses[2].headers.get('content-type'), /image\/png/);
});

test('expõe o estado de saúde do serviço', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    status: 'degraded',
    service: 'biblioteca-neabi',
    databases: { postgresql: 'disconnected', mongodb: 'disconnected' },
  });
});

test('documenta os recursos disponíveis na raiz da API', async () => {
  const response = await fetch(`${baseUrl}/api`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.servico, 'API Biblioteca NEABI');
  assert.equal(payload.recursos.artigos, '/api/artigos');
  assert.equal(payload.recursos.comentarios, '/api/comentarios');
  assert.equal(payload.recursos.configuracao, '/api/config');
});

test('expõe a integração opcional com o site-mãe', async () => {
  const response = await fetch(`${baseUrl}/api/config`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { siteMaeUrl: null });
});

test('responde em JSON para uma rota de API inexistente', async () => {
  const response = await fetch(`${baseUrl}/api/rota-inexistente`);
  const payload = await response.json();

  assert.equal(response.status, 404);
  assert.equal(payload.erro.mensagem, 'Rota não encontrada: GET /api/rota-inexistente');
});

test('rejeita identificador relacional inválido antes de consultar o banco', async () => {
  const response = await fetch(`${baseUrl}/api/categorias/abc`);
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.erro.mensagem, 'O identificador deve ser um inteiro positivo.');
});

test('rejeita JSON malformado com uma mensagem clara', async () => {
  const response = await fetch(`${baseUrl}/api/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{',
  });
  const payload = await response.json();

  assert.equal(response.status, 400);
  assert.equal(payload.erro.mensagem, 'O corpo da requisição contém JSON inválido.');
});
