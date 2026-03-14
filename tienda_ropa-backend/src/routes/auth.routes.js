const router = require('express').Router();
const { register, login, perfil } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');

router.post('/register', register);
router.post('/login',    login);
router.get('/perfil',    auth, perfil);

module.exports = router;