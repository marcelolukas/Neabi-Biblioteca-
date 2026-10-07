const router = require('express').Router();
const controller = require('../controllers/participanteController');
const asyncHandler = require('../middlewares/asyncHandler');

router.get('/', asyncHandler(controller.list));
router.post('/', asyncHandler(controller.create));
router.get('/:id', asyncHandler(controller.get));
router.put('/:id', asyncHandler(controller.update));
router.patch('/:id', asyncHandler(controller.update));
router.delete('/:id', asyncHandler(controller.delete));

module.exports = router;
