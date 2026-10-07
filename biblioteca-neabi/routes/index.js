const router = require('express').Router();

router.get('/', (request, response) => {
  response.json({
    servico: 'API Biblioteca NEABI',
    versao: '1.0.0',
    recursos: {
      categorias: '/api/categorias',
      participantes: '/api/participantes',
      artigos: '/api/artigos',
      comentarios: '/api/comentarios',
      interacoes: '/api/interacoes',
      configuracao: '/api/config',
      saude: '/api/health',
    },
  });
});

router.use('/categorias', require('./categoriaRoutes'));
router.use('/participantes', require('./participanteRoutes'));
router.use('/artigos', require('./artigoRoutes'));
router.use('/comentarios', require('./comentarioRoutes'));
router.use('/interacoes', require('./interacaoRoutes'));

module.exports = router;
