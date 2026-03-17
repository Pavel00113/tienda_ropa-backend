const router = require('express').Router();
const ctrl   = require('../controllers/carrito.controller');
const auth   = require('../middlewares/auth');

router.get('/',         auth, ctrl.getCarrito);
router.post('/',        auth, ctrl.addToCarrito);
router.put('/:id',      auth, ctrl.updateCarrito);
router.delete('/clear', auth, ctrl.clearCarrito);
router.delete('/:id',   auth, ctrl.removeFromCarrito);

module.exports = router;