const router     = require('express').Router();
const ctrl       = require('../controllers/productos.controller');
const auth       = require('../middlewares/auth');
const isAdmin    = require('../middlewares/isAdmin');
const upload     = require('../middlewares/upload');

// Públicas
router.get('/',    ctrl.getProductos);
router.get('/:id', ctrl.getProducto);

// Solo admin
router.post('/',    auth, isAdmin, upload.single('imagen'), ctrl.createProducto);
router.put('/:id',  auth, isAdmin, ctrl.updateProducto);
router.delete('/:id', auth, isAdmin, ctrl.deleteProducto);

module.exports = router;