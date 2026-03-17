const router  = require('express').Router();
const ctrl    = require('../controllers/admin.controller');
const auth    = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// Todos los endpoints requieren auth + isAdmin
router.use(auth, isAdmin);

router.get('/dashboard',           ctrl.getDashboard);
router.get('/pedidos',             ctrl.getAllPedidos);
router.put('/pedidos/:id/estado',  ctrl.updateEstadoPedido);
router.get('/usuarios',            ctrl.getAllUsuarios);
router.post('/inventario',         ctrl.updateInventario);

module.exports = router;