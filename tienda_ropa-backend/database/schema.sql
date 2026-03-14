-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM tipos
CREATE TYPE rol_usuario AS ENUM ('admin', 'cliente');
CREATE TYPE genero_categoria AS ENUM ('hombre', 'mujer', 'unisex');
CREATE TYPE estado_pedido AS ENUM ('pendiente', 'pagado', 'enviado', 'entregado', 'cancelado');
CREATE TYPE talla_ropa AS ENUM ('XS', 'S', 'M', 'L', 'XL', 'XXL');

-- USUARIOS
CREATE TABLE usuarios (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       VARCHAR(100) NOT NULL,
  email        VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  rol          rol_usuario DEFAULT 'cliente',
  avatar_url   TEXT,
  created_at   TIMESTAMP DEFAULT NOW()
);

-- CATEGORIAS
CREATE TABLE categorias (
  id       SERIAL PRIMARY KEY,
  nombre   VARCHAR(100) NOT NULL,
  genero   genero_categoria NOT NULL,
  slug     VARCHAR(100) UNIQUE NOT NULL,
  imagen_url TEXT,
  activo   BOOLEAN DEFAULT TRUE
);

-- PRODUCTOS
CREATE TABLE productos (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre       VARCHAR(200) NOT NULL,
  descripcion  TEXT,
  precio       DECIMAL(10,2) NOT NULL CHECK (precio > 0),
  precio_oferta DECIMAL(10,2),
  categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
  activo       BOOLEAN DEFAULT TRUE,
  destacado    BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

-- IMÁGENES DE PRODUCTOS (múltiples por producto)
CREATE TABLE producto_imagenes (
  id           SERIAL PRIMARY KEY,
  producto_id  UUID REFERENCES productos(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  public_id    TEXT,        -- ID de Cloudinary para eliminar
  es_principal BOOLEAN DEFAULT FALSE
);

-- INVENTARIO (por talla y color)
CREATE TABLE inventario (
  id          SERIAL PRIMARY KEY,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  talla       talla_ropa NOT NULL,
  color       VARCHAR(50),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE(producto_id, talla, color)
);

-- CARRITO
CREATE TABLE carrito_items (
  id          SERIAL PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  inventario_id INTEGER REFERENCES inventario(id),
  cantidad    INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  added_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, inventario_id)
);

-- PEDIDOS
CREATE TABLE pedidos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id       UUID REFERENCES usuarios(id),
  total            DECIMAL(10,2) NOT NULL,
  estado           estado_pedido DEFAULT 'pendiente',
  direccion_envio  JSONB,
  notas            TEXT,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ITEMS DE PEDIDO
CREATE TABLE pedido_items (
  id              SERIAL PRIMARY KEY,
  pedido_id       UUID REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     UUID REFERENCES productos(id),
  nombre_producto VARCHAR(200), -- snapshot por si el producto se elimina
  imagen_url      TEXT,
  talla           talla_ropa,
  color           VARCHAR(50),
  cantidad        INTEGER NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL
);

-- WISHLIST
CREATE TABLE wishlist (
  id          SERIAL PRIMARY KEY,
  usuario_id  UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- RESEÑAS
CREATE TABLE reseñas (
  id           SERIAL PRIMARY KEY,
  usuario_id   UUID REFERENCES usuarios(id),
  producto_id  UUID REFERENCES productos(id) ON DELETE CASCADE,
  calificacion INTEGER CHECK (calificacion BETWEEN 1 AND 5),
  comentario   TEXT,
  created_at   TIMESTAMP DEFAULT NOW(),
  UNIQUE(usuario_id, producto_id)
);

-- ÍNDICES para rendimiento
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_inventario_producto ON inventario(producto_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_carrito_usuario ON carrito_items(usuario_id);