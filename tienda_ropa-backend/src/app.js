const express = require('express');
const cors    = require('cors');
require('dotenv').config();
require('./config/db'); 

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: '🛍️ Tienda Ropa API funcionando' });
});

// Rutas (las iremos agregando)
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/productos',  require('./routes/productos.routes'));
// app.use('/api/categorias', require('./routes/categorias.routes'));
// app.use('/api/carrito',    require('./routes/carrito.routes'));
// app.use('/api/pedidos',    require('./routes/pedidos.routes'));
// app.use('/api/admin',      require('./routes/admin.routes'));

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;