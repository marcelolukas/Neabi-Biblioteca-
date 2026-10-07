const router = require('express').Router();
const controller = require('../controllers/comentarioController');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', asyncHandler(controller.update));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));
router.post('/:id/respostas', asyncHandler(controller.addReply));
router.post('/:id/reacoes', asyncHandler(controller.react));

module.exports = router;
