CREATE TEMP TABLE academy_products (
  id integer PRIMARY KEY,
  stock integer NOT NULL CHECK (stock >= 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0)
);
CREATE TEMP TABLE academy_order_items (
  order_id integer PRIMARY KEY,
  product_id integer NOT NULL REFERENCES academy_products(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0)
);
INSERT INTO academy_products VALUES (1, 3, 4990);

BEGIN;
DO $$
DECLARE
  affected integer;
  reserved_price integer;
BEGIN
  UPDATE academy_products
  SET stock = stock - 2
  WHERE id = 1 AND stock >= 2
  RETURNING unit_price_cents INTO reserved_price;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN
    RAISE EXCEPTION 'Product missing or insufficient stock';
  END IF;
  INSERT INTO academy_order_items
    (order_id, product_id, quantity, unit_price_cents)
  VALUES (101, 1, 2, reserved_price);
END $$;
COMMIT;
SELECT id, stock FROM academy_products;
SELECT order_id, quantity, unit_price_cents FROM academy_order_items;

CREATE TEMP TABLE academy_events (
  id integer PRIMARY KEY,
  customer_id integer NOT NULL,
  created_at timestamptz NOT NULL
);
INSERT INTO academy_events
SELECT n, n % 1000, TIMESTAMPTZ '2026-01-01 00:00:00+00' + n * INTERVAL '1 minute'
FROM generate_series(1, 20000) AS n;
ANALYZE academy_events;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at FROM academy_events
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 5;
CREATE INDEX academy_events_customer_created_idx
ON academy_events (customer_id, created_at DESC);
ANALYZE academy_events;
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, created_at FROM academy_events
WHERE customer_id = 42 ORDER BY created_at DESC LIMIT 5;

ALTER TABLE academy_products ADD COLUMN reserved integer;
UPDATE academy_products SET reserved = 0 WHERE reserved IS NULL;
ALTER TABLE academy_products ALTER COLUMN reserved SET DEFAULT 0;
ALTER TABLE academy_products ALTER COLUMN reserved SET NOT NULL;
ALTER TABLE academy_products ADD CONSTRAINT academy_reserved_nonnegative
  CHECK (reserved >= 0);
SELECT id, stock, reserved FROM academy_products;
