const pool = require('../config/db');

// VER CARRITO
const getCarrito = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.cantidad, ci.inventario_id,
              p.id as producto_id, p.nombre, p.precio, p.precio_oferta,
              pi2.url as imagen,
              inv.talla, inv.color, inv.stock
       FROM carrito_items ci
       JOIN inventario inv ON ci.inventario_id = inv.id
       JOIN productos p ON inv.producto_id = p.id
       LEFT JOIN producto_imagenes pi2 ON pi2.producto_id = p.id AND pi2.es_principal = true
       WHERE ci.usuario_id = $1`,
      [req.usuario.id]
    );

    const total = result.rows.reduce((sum, item) => {
      const precio = item.precio_oferta || item.precio;
      return sum + (precio * item.cantidad);
    }, 0);

    res.json({ items: result.rows, total: total.toFixed(2) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
};

// AGREGAR AL CARRITO
const addToCarrito = async (req, res) => {
  const { inventario_id, cantidad = 1 } = req.body;

  if (!inventario_id)
    return res.status(400).json({ error: 'inventario_id es obligatorio' });

  try {
    // Verificar stock disponible
    const inv = await pool.query(
      'SELECT * FROM inventario WHERE id = $1',
      [inventario_id]
    );

    if (inv.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    if (inv.rows[0].stock < cantidad)
      return res.status(400).json({ error: 'Stock insuficiente' });

    // Si ya existe en carrito, actualizar cantidad
    const existe = await pool.query(
      'SELECT * FROM carrito_items WHERE usuario_id = $1 AND inventario_id = $2',
      [req.usuario.id, inventario_id]
    );

    if (existe.rows.length > 0) {
      await pool.query(
        'UPDATE carrito_items SET cantidad = cantidad + $1 WHERE usuario_id = $2 AND inventario_id = $3',
        [cantidad, req.usuario.id, inventario_id]
      );
    } else {
      await pool.query(
        'INSERT INTO carrito_items (usuario_id, inventario_id, cantidad) VALUES ($1, $2, $3)',
        [req.usuario.id, inventario_id, cantidad]
      );
    }

    res.json({ message: 'Producto agregado al carrito' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
};

// ACTUALIZAR CANTIDAD
const updateCarrito = async (req, res) => {
  const { id } = req.params;
  const { cantidad } = req.body;

  if (!cantidad || cantidad < 1)
    return res.status(400).json({ error: 'Cantidad inválida' });

  try {
    const result = await pool.query(
      `UPDATE carrito_items SET cantidad = $1
       WHERE id = $2 AND usuario_id = $3 RETURNING *`,
      [cantidad, id, req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Item no encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar carrito' });
  }
};

// ELIMINAR DEL CARRITO
const removeFromCarrito = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM carrito_items WHERE id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    );
    res.json({ message: 'Producto eliminado del carrito' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
};

// VACIAR CARRITO
const clearCarrito = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM carrito_items WHERE usuario_id = $1',
      [req.usuario.id]
    );
    res.json({ message: 'Carrito vaciado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al vaciar carrito' });
  }
};

module.exports = { getCarrito, addToCarrito, updateCarrito, removeFromCarrito, clearCarrito };