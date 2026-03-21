const pool       = require('../config/db');
const cloudinary = require('../config/cloudinary');

// LISTAR PRODUCTOS (con filtro por categoría opcional)
const getProductos = async (req, res) => {
  const { categoria_id, destacado, limit = 20, offset = 0 } = req.query;

  try {
    let query = `
      SELECT p.*, c.nombre as categoria_nombre, c.genero,
             pi.url as imagen_principal
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id AND pi.es_principal = true
      WHERE p.activo = true
    `;
    const params = [];

    if (categoria_id) {
      params.push(categoria_id);
      query += ` AND p.categoria_id = $${params.length}`;
    }
    if (destacado) {
      query += ` AND p.destacado = true`;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

// OBTENER UN PRODUCTO
const getProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const producto = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre, c.genero
       FROM productos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = $1 AND p.activo = true`,
      [id]
    );

    if (producto.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    const imagenes = await pool.query(
      'SELECT * FROM producto_imagenes WHERE producto_id = $1 ORDER BY es_principal DESC',
      [id]
    );

    const inventario = await pool.query(
      'SELECT * FROM inventario WHERE producto_id = $1',
      [id]
    );

    res.json({
      ...producto.rows[0],
      imagenes: imagenes.rows,
      inventario: inventario.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

// CREAR PRODUCTO (solo admin)
const createProducto = async (req, res) => {
  const { nombre, descripcion, precio, precio_oferta, categoria_id, destacado, maneja_tallas } = req.body;

  if (!nombre || !precio)
    return res.status(400).json({ error: 'Nombre y precio son obligatorios' });

  try {
    const result = await pool.query(
      `INSERT INTO productos (nombre, descripcion, precio, precio_oferta, categoria_id, destacado, maneja_tallas)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [nombre, descripcion, precio, precio_oferta || null, categoria_id || null, destacado || false, maneja_tallas || false]
    );

    const producto = result.rows[0];

    if (req.file) {
      await pool.query(
        `INSERT INTO producto_imagenes (producto_id, url, public_id, es_principal)
         VALUES ($1, $2, $3, true)`,
        [producto.id, req.file.path, req.file.filename]
      );
      producto.imagen_principal = req.file.path;
    }

    res.status(201).json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

// ACTUALIZAR PRODUCTO (solo admin)
const updateProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, precio_oferta, categoria_id, destacado, activo, maneja_tallas } = req.body;

  try {
    const result = await pool.query(
      `UPDATE productos
       SET nombre        = COALESCE($1, nombre),
           descripcion   = COALESCE($2, descripcion),
           precio        = COALESCE($3, precio),
           precio_oferta = $4,
           categoria_id  = COALESCE($5, categoria_id),
           destacado     = COALESCE($6, destacado),
           activo        = COALESCE($7, activo),
           maneja_tallas = COALESCE($8, maneja_tallas),
           updated_at    = NOW()
       WHERE id = $9
       RETURNING *`,
      [nombre, descripcion, precio, precio_oferta || null, categoria_id, destacado, activo, maneja_tallas, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Producto no encontrado' });

    const producto = result.rows[0];

    if (req.file) {
      const anterior = await pool.query(
        'SELECT public_id FROM producto_imagenes WHERE producto_id = $1 AND es_principal = true',
        [id]
      );
      if (anterior.rows.length > 0 && anterior.rows[0].public_id) {
        await cloudinary.uploader.destroy(anterior.rows[0].public_id);
      }
      await pool.query(
        'UPDATE producto_imagenes SET es_principal = false WHERE producto_id = $1',
        [id]
      );
      const imgResult = await pool.query(
        `INSERT INTO producto_imagenes (producto_id, url, public_id, es_principal)
         VALUES ($1, $2, $3, true) RETURNING url`,
        [id, req.file.path, req.file.filename]
      );
      producto.imagen_principal = imgResult.rows[0].url;
    }

    res.json(producto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const uploadImagenesProducto = async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron imágenes' });
    }

    for (const file of req.files) {
      await pool.query(
        `INSERT INTO producto_imagenes (producto_id, url, public_id, es_principal)
         VALUES ($1, $2, $3, false)`,
        [
          id,
          file.path,
          file.filename
        ]
      );
    }

    res.json({ message: 'Imágenes subidas correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al subir imágenes' });
  }
};
// ELIMINAR PRODUCTO (solo admin)
const deleteProducto = async (req, res) => {
  const { id } = req.params;
  try {
    // Eliminar imágenes de Cloudinary
    const imagenes = await pool.query(
      'SELECT public_id FROM producto_imagenes WHERE producto_id = $1',
      [id]
    );

    for (const img of imagenes.rows) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    // Soft delete
    await pool.query(
      'UPDATE productos SET activo = false WHERE id = $1',
      [id]
    );

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};
const updateImagenPrincipal = async (req, res) => {
  const { id } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió imagen' });
    }

    // quitar la anterior principal
    await pool.query(
      `UPDATE producto_imagenes
       SET es_principal = false
       WHERE producto_id = $1`,
      [id]
    );

    // insertar nueva principal
    const result = await pool.query(
      `INSERT INTO producto_imagenes (producto_id, url, public_id, es_principal)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [id, req.file.path, req.file.filename]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar imagen principal' });
  }
};
const deleteImagen = async (req, res) => {
  const { imagenId } = req.params;

  try {
    const result = await pool.query(
      'SELECT public_id FROM producto_imagenes WHERE id = $1',
      [imagenId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Imagen no encontrada' });
    }

    const public_id = result.rows[0].public_id;

    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
    }

    await pool.query(
      'DELETE FROM producto_imagenes WHERE id = $1',
      [imagenId]
    );

    res.json({ message: 'Imagen eliminada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar imagen' });
  }
};
// UPSERT INVENTARIO
const upsertInventario = async (req, res) => {
  const { id } = req.params;
  const { items } = req.body; // [{ talla, stock }]

  try {
    // Elimina el inventario anterior del producto
    await pool.query('DELETE FROM inventario WHERE producto_id = $1', [id]);

    // Inserta los nuevos items
    for (const item of items) {
      if (item.stock > 0) {
        await pool.query(
          `INSERT INTO inventario (producto_id, talla, stock)
           VALUES ($1, $2, $3)`,
          [id, item.talla, item.stock]
        );
      }
    }

    res.json({ message: 'Inventario actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar inventario' });
  }
};
module.exports = { getProductos, getProducto, createProducto, updateProducto, deleteProducto, uploadImagenesProducto, updateImagenPrincipal, deleteImagen, upsertInventario };
