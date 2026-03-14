const isAdmin = (req, res, next) => {
  if (req.usuario?.rol !== 'admin')
    return res.status(403).json({ error: 'Acceso solo para administradores' });
  next();
};

module.exports = isAdmin;