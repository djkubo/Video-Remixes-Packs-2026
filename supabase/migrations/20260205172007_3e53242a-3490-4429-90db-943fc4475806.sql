-- Agregar columna de búsqueda de texto completo (FTS) a tracks
-- Usa ts_vector para búsqueda eficiente

-- Agregar columna search_vector si no existe
ALTER TABLE public.tracks 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Crear función para actualizar el search_vector
CREATE OR REPLACE FUNCTION public.tracks_search_vector_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.artist, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.genre, '')), 'C');
  RETURN NEW;
END;
$$;

-- Crear trigger para actualizar automáticamente
DROP TRIGGER IF EXISTS tracks_search_vector_trigger ON public.tracks;
CREATE TRIGGER tracks_search_vector_trigger
BEFORE INSERT OR UPDATE OF title, artist, genre
ON public.tracks
FOR EACH ROW
EXECUTE FUNCTION public.tracks_search_vector_update();

-- Actualizar registros existentes
UPDATE public.tracks SET 
  search_vector = 
    setweight(to_tsvector('spanish', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(artist, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(genre, '')), 'C');

-- Crear índice GIN para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_tracks_search_vector 
ON public.tracks USING GIN(search_vector);

-- Función RPC para búsqueda FTS
CREATE OR REPLACE FUNCTION public.search_tracks(
  p_query TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  artist TEXT,
  file_url TEXT,
  duration_formatted TEXT,
  bpm INTEGER,
  genre TEXT,
  rank REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  search_query tsquery;
BEGIN
  -- Convertir query a tsquery con prefijo para autocompletado
  search_query := plainto_tsquery('spanish', p_query) || to_tsquery('spanish', p_query || ':*');
  
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.artist,
    t.file_url,
    t.duration_formatted,
    t.bpm,
    t.genre,
    ts_rank(t.search_vector, search_query) as rank
  FROM tracks t
  WHERE t.is_visible = true
    AND t.search_vector @@ search_query
  ORDER BY rank DESC, t.title ASC
  LIMIT p_limit;
END;
$$;