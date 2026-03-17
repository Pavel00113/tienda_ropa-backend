const pool = require('../config/db');

// VER MIS PEDIDOS
const getMisPedidos = async (req, res) => {
  try {
    const pedidos = await pool.query(
      `SELECT p.*, COUNT(pi.id) as total_items
       FROM pedidos p
       LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
       WHERE p.usuario_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.usuario.id]
    );
    res.json(pedidos.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// VER UN PEDIDO
const getPedido = async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await pool.query(
      'SELECT * FROM pedidos WHERE id = $1 AND usuario_id = $2',
      [id, req.usuario.id]
    );

    if (pedido.rows.length === 0)
      return res.status(404).json({ error: 'Pedido no encontrado' });

    const items = await pool.query(
      'SELECT * FROM pedido_items WHERE pedido_id = $1',
      [id]
    );

    res.json({ ...pedido.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener pedido' });
  }
};

// CREAR PEDIDO DESDE EL CARRITO
const createPedido = async (req, res) => {
  const { direccion_envio, notas } = req.body;

  if (!direccion_envio)
    return res.status(400).json({ error: 'Dirección de envío requerida' });

  try {
    // Obtener items del carrito
    const carrito = await pool.query(
      `SELECT ci.cantidad, p.id as producto_id, p.nombre,
              p.precio, p.precio_oferta,
              inv.talla, inv.color, inv.stock,
              pi2.url as imagen
       FROM carrito_items ci
       JOIN inventario inv ON ci.inventario_id = inv.id
       JOIN productos p ON inv.producto_id = p.id
       LEFT JOIN producto_imagenes pi2 ON pi2.producto_id = p.id AND pi2.es_principal = true
       WHERE ci.usuario_id = $1`,
      [req.usuario.id]
    );

    if (carrito.rows.length === 0)
      return res.status(400).json({ error: 'El carrito está vacío' });

    // Verificar stock
    for (const item of carrito.rows) {
      if (item.stock < item.cantidad)
        return res.status(400).json({
          error: `Stock insuficiente para ${item.nombre}`
        });
    }

    // Calcular total
    const total = carrito.rows.reduce((sum, item) => {
      const precio = item.precio_oferta || item.precio;
      return sum + (precio * item.cantidad);
    }, 0);

    // Crear pedido
    const pedido = await pool.query(
      `INSERT INTO pedidos (usuario_id, total, direccion_envio, notas)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.usuario.id, total.toFixed(2), direccion_envio, notas || null]
    );

    const pedido_id = pedido.rows[0].id;

    // Insertar items del pedido y descontar stock
    for (const item of carrito.rows) {
      const precio_unitario = item.precio_oferta || item.precio;

      await pool.query(
        `INSERT INTO pedido_items
         (pedido_id, producto_id, nombre_producto, imagen_url, talla, color, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [pedido_id, item.producto_id, item.nombre, item.imagen,
         item.talla, item.color, item.cantidad, precio_unitario]
      );

      // Descontar stock
      await pool.query(
        `UPDATE inventario SET stock = stock - $1
         WHERE producto_id = $2 AND talla = $3`,
        [item.cantidad, item.producto_id, item.talla]
      );
    }

    // Vaciar carrito
    await pool.query(
      'DELETE FROM carrito_items WHERE usuario_id = $1',
      [req.usuario.id]
    );

    res.status(201).json(pedido.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear pedido' });
  }
};

// CANCELAR PEDIDO
const cancelarPedido = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE pedidos SET estado = 'cancelado'
       WHERE id = $1 AND usuario_id = $2 AND estado = 'pendiente'
       RETURNING *`,
      [id, req.usuario.id]
    );

    if (result.rows.length === 0)
      return res.status(400).json({ error: 'No se puede cancelar este pedido' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al cancelar pedido' });
  }
};

module.exports = { getMisPedidos, getPedido, createPedido, cancelarPedido };