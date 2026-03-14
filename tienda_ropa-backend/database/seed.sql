-- 3 CUENTAS ADMINISTRADOR
-- Contraseñas hasheadas con bcrypt (valor ejemplo: "Admin123!")
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
  ('Admin Principal',  'mottamendozap@gmail.com',   'mottapavel', 'admin'),
  ('Admin Ventas',     'ventas@tiendaropa.com',   '$2b$10$HASH_AQUI_2', 'admin'),
  ('Admin Soporte',    'soporte@tiendaropa.com',  '$2b$10$HASH_AQUI_3', 'admin');

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