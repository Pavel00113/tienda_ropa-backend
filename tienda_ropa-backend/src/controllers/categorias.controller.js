const pool = require('../config/db');

// LISTAR TODAS
const getCategorias = async (req, res) => {
  const { genero } = req.query;
  try {
    let query = 'SELECT * FROM categorias WHERE activo = true';
    const params = [];

    if (genero) {
      params.push(genero);
      query += ` AND genero = $1`;
    }

    query += ' ORDER BY genero, nombre';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// OBTENER UNA CATEGORIA
const getCategoria = async (req, res) => {
  const { id } = req.params;
  try {
    const categoria = await pool.query(
      'SELECT * FROM categorias WHERE id = $1 AND activo = true',
      [id]
    );

    if (categoria.rows.length === 0)
      return res.status(404).json({ error: 'Categoría no encontrada' });

    const productos = await pool.query(
      `SELECT p.*, pi.url as imagen_principal
       FROM productos p
       LEFT JOIN producto_imagenes pi ON pi.producto_id = p.id AND pi.es_principal = true
       WHERE p.categoria_id = $1 AND p.activo = true
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({
      ...categoria.rows[0],
      productos: productos.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener categoría' });
  }
};

// CREAR CATEGORIA (solo admin)
const createCategoria = async (req, res) => {
  const { nombre, genero, slug } = req.body;

  if (!nombre || !genero || !slug)
    return res.status(400).json({ error: 'Nombre, género y slug son obligatorios' });

  try {
    const result = await pool.query(
      `INSERT INTO categorias (nombre, genero, slug)
       VALUES ($1, $2, $3) RETURNING *`,
      [nombre, genero, slug]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(400).json({ error: 'El slug ya existe' });
    res.status(500).json({ error: 'Error al crear categoría' });
  }
};

// ACTUALIZAR (solo admin)
const updateCategoria = async (req, res) => {
  const { id } = req.params;
  const { nombre, genero, slug, activo } = req.body;
  try {
    const result = await pool.query(
      `UPDATE categorias
       SET nombre = COALESCE($1, nombre),
           genero = COALESCE($2, genero),
           slug   = COALESCE($3, slug),
           activo = COALESCE($4, activo)
       WHERE id = $5 RETURNING *`,
      [nombre, genero, slug, activo, id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Categoría no encontrada' });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

module.exports = { getCategorias, getCategoria, createCategoria, updateCategoria };