const router     = require('express').Router();
const ctrl       = require('../controllers/productos.controller');
const auth       = require('../middlewares/auth');
const isAdmin    = require('../middlewares/isAdmin');
const upload     = require('../middlewares/upload');

// Públicas
router.get('/',    ctrl.getProductos);
router.get('/:id', ctrl.getProducto);

// Admin rutas especiales primero
router.post('/:id/imagenes', auth, isAdmin, upload.array('imagenes', 3), ctrl.uploadImagenesProducto);
router.put('/:id/imagen-principal', auth, isAdmin, upload.single('imagen'), ctrl.updateImagenPrincipal);
router.delete('/imagenes/:imagenId', auth, isAdmin, ctrl.deleteImagen);

// Luego rutas con :id
router.get('/:id', ctrl.getProducto);
router.put('/:id/inventario', auth, isAdmin, ctrl.upsertInventario);

// CRUD principal
router.post('/', auth, isAdmin, upload.single('imagen'), ctrl.createProducto);
router.put('/:id', auth, isAdmin, upload.single('imagen'), ctrl.updateProducto);
router.delete('/:id', auth, isAdmin, ctrl.deleteProducto);

module.exports = router;