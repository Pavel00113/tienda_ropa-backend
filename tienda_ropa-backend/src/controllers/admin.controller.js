const pool = require('../config/db');

// VER TODOS LOS PEDIDOS
const getAllPedidos = async (req, res) => {
  const { estado, limit = 20, offset = 0 } = req.query;
  try {
    let query = `
      SELECT p.*, u.nombre as cliente, u.email,
             COUNT(pi.id) as total_items
      FROM pedidos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
    `;
    const params = [];

    if (estado) {
      params.push(estado);
      query += ` WHERE p.estado = $1`;
    }

    query += ` GROUP BY p.id, u.nombre, u.email
               ORDER BY p.created_at DESC
               LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// ACTUALIZAR ESTADO DE PEDIDO
const updateEstadoPedido = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estados = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
  if (!estados.includes(estado))
    return res.status(400).json({ error: 'Estado inválido' });

  try {
    const result = await pool.query(
      `UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Pedido no encontrado' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar pedido' });
  }
};

// VER TODOS LOS USUARIOS
const getAllUsuarios = async (req, res) => {
  const { rol } = req.query;
  try {
    let query = `
      SELECT u.id, u.nombre, u.email, u.rol, u.created_at,
             COUNT(p.id) as total_pedidos
      FROM usuarios u
      LEFT JOIN pedidos p ON p.usuario_id = u.id
    `;
    const params = [];

    if (rol) {
      params.push(rol);
      query += ` WHERE u.rol = $1`;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ESTADISTICAS DEL DASHBOARD
const getDashboard = async (req, res) => {
  try {
    const [usuarios, pedidos, productos, ingresos] = await Promise.all([
      pool.query(`SELECT COUNT(*) as total FROM usuarios WHERE rol = 'cliente'`),
      pool.query(`SELECT COUNT(*) as total FROM pedidos`),
      pool.query(`SELECT COUNT(*) as total FROM productos WHERE activo = true`),
      pool.query(`SELECT COALESCE(SUM(total), 0) as total FROM pedidos WHERE estado != 'cancelado'`)
    ]);

    const pedidos_por_estado = await pool.query(`
      SELECT estado, COUNT(*) as cantidad
      FROM pedidos
      GROUP BY estado
    `);

    res.json({
      total_clientes:  parseInt(usuarios.rows[0].total),
      total_pedidos:   parseInt(pedidos.rows[0].total),
      total_productos: parseInt(productos.rows[0].total),
      ingresos_totales: parseFloat(ingresos.rows[0].total),
      pedidos_por_estado: pedidos_por_estado.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// GESTIONAR INVENTARIO
const updateInventario = async (req, res) => {
  const { producto_id, talla, color, stock } = req.body;

  if (!producto_id || !talla || stock === undefined)
    return res.status(400).json({ error: 'producto_id, talla y stock son obligatorios' });

  try {
    const result = await pool.query(
      `INSERT INTO inventario (producto_id, talla, color, stock)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (producto_id, talla, color)
       DO UPDATE SET stock = $4
       RETURNING *`,
      [producto_id, talla, color || null, stock]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
};

module.exports = {
  getAllPedidos,
  updateEstadoPedido,
  getAllUsuarios,
  getDashboard,
  updateInventario
};