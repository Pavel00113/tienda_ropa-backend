const router  = require('express').Router();
const ctrl    = require('../controllers/categorias.controller');
const auth    = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

// Públicas
router.get('/',    ctrl.getCategorias);
router.get('/:id', ctrl.getCategoria);

// Solo admin
router.post('/',    auth, isAdmin, ctrl.createCategoria);
router.put('/:id',  auth, isAdmin, ctrl.updateCategoria);

module.exports = router;