-- 3 CUENTAS ADMINISTRADOR
-- Contraseñas hasheadas con bcrypt (valor ejemplo: "Admin123!")
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Admin Principal',  'mottamendozap@gmail.com',   '$2b$10$ZwCGtxkUCK3yDsUOsANNmOAqpRe9mONQDkDp5sEyWZqjLQrikV84O', 'admin'),
  ('Admin Ventas',     'ventas@tiendaropa.com',   '$2b$10$ZwCGtxkUCK3yDsUOsANNmOAqpRe9mONQDkDp5sEyWZqjLQrikV84O', 'admin'),
  ('Admin Soporte',    'soporte@tiendaropa.com',  '$2b$10$ZwCGtxkUCK3yDsUOsANNmOAqpRe9mONQDkDp5sEyWZqjLQrikV84O', 'admin');

-- CATEGORÍAS HOMBRE
INSERT INTO categorias (nombre, genero, slug) VALUES
  ('Casacas',    'hombre', 'hombre-casacas'),
  ('Polares',    'hombre', 'hombre-polares'),
  ('Pantalones', 'hombre', 'hombre-pantalones'),
  ('Zapatillas', 'hombre', 'hombre-zapatillas');

-- CATEGORÍAS MUJER
INSERT INTO categorias (nombre, genero, slug) VALUES
  ('Casacas',    'mujer', 'mujer-casacas');

-- CATEGORÍAS ADICIONALES (opcionales)
INSERT INTO categorias (nombre, genero, slug) VALUES
  ('Accesorios', 'unisex', 'accesorios'),
  ('Ofertas',    'unisex', 'ofertas');