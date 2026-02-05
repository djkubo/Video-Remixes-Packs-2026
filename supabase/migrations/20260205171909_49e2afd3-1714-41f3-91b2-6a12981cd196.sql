-- Función RPC: update_sort_order
-- Actualiza el sort_order de múltiples registros en una sola operación
-- Recibe un array JSON de objetos {id, sort_order} y el nombre de la tabla
CREATE OR REPLACE FUNCTION public.update_sort_order(
  p_table TEXT,
  p_items JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item JSONB;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validar tabla permitida
  IF p_table NOT IN ('folders', 'tracks') THEN
    RAISE EXCEPTION 'Invalid table: %', p_table;
  END IF;

  -- Actualizar cada item
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF p_table = 'folders' THEN
      UPDATE folders 
      SET sort_order = (item->>'sort_order')::INTEGER,
          updated_at = now()
      WHERE id = (item->>'id')::UUID;
    ELSIF p_table = 'tracks' THEN
      UPDATE tracks 
      SET sort_order = (item->>'sort_order')::INTEGER,
          updated_at = now()
      WHERE id = (item->>'id')::UUID;
    END IF;
  END LOOP;
END;
$$;