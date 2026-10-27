-- ==============================================================================
-- Esquema SQL para la tabla 'emisiones' en Supabase para EcoTrack
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- ==============================================================================

-- 1. Crear el enum de categorías válidas
DO $$ BEGIN
    CREATE TYPE carbon_category AS ENUM ('Transporte', 'Energía', 'Residuos');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Crear la tabla de emisiones
CREATE TABLE IF NOT EXISTS public.emisiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fuente TEXT NOT NULL,
    categoría TEXT NOT NULL CHECK (categoría IN ('Transporte', 'Energía', 'Residuos')),
    co2_producido NUMERIC(10, 2) NOT NULL CHECK (co2_producido > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.emisiones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para lectura e inserción pública/anónima (ajustar según auth)
CREATE POLICY "Permitir lectura de emisiones" 
ON public.emisiones 
FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserción de emisiones" 
ON public.emisiones 
FOR INSERT 
WITH CHECK (true);
