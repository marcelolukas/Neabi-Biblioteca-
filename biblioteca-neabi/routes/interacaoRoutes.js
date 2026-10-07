const router = require('express').Router();
const controller = require('../controllers/interacaoController');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/resumo', asyncHandler(controller.summary));
router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', asyncHandler(controller.update));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

module.exports = router;
