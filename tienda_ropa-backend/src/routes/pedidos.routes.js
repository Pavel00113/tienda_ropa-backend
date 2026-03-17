const router = require('express').Router();
const ctrl   = require('../controllers/pedidos.controller');
const auth   = require('../middlewares/auth');

router.get('/',        auth, ctrl.getMisPedidos);
router.get('/:id',     auth, ctrl.getPedido);
router.post('/',       auth, ctrl.createPedido);
router.put('/:id/cancelar', auth, ctrl.cancelarPedido);

module.exports = router;