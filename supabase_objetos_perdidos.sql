-- MIGRACIÓN SUPABASE: OBJETOS PERDIDOS Y DESPACHOS
-- Ejecutar en el SQL Editor del panel de Supabase si se desea persistencia directa en DB

CREATE TABLE IF NOT EXISTS public.objetos_perdidos (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    fecha_hallazgo DATE NOT NULL,
    numero_planilla TEXT NOT NULL,
    personal_hallazgo TEXT NOT NULL,
    unidad_interno TEXT,
    recorrido_turno TEXT,
    sector_hallazgo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Encontrado',
    operador_garita_id TEXT,
    operador_garita_nombre TEXT,
    conductor_firmo BOOLEAN DEFAULT FALSE,
    conductor_firma_fecha TIMESTAMPTZ,
    conductor_firma_usuario TEXT,
    despacho_id TEXT,
    ubicacion_actual TEXT,
    datos_entrega JSONB DEFAULT '{}'::jsonb,
    datos_donacion JSONB DEFAULT '{}'::jsonb,
    datos_destruccion JSONB DEFAULT '{}'::jsonb,
    trazabilidad JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS public.despachos_objetos_perdidos (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    fecha_envio DATE NOT NULL,
    numero_precinto TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'Pendiente de Transporte',
    operador_despacha_id TEXT,
    operador_despacha_nombre TEXT,
    transportador_id TEXT,
    transportador_nombre TEXT,
    transportador_fecha TIMESTAMPTZ,
    receptor_id TEXT,
    receptor_nombre TEXT,
    receptor_fecha TIMESTAMPTZ,
    ubicacion_oficina TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    trazabilidad JSONB DEFAULT '[]'::jsonb
);

-- Políticas de Acceso RLS
ALTER TABLE public.objetos_perdidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despachos_objetos_perdidos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objetos_perdidos' AND policyname = 'Allow all access to objetos_perdidos'
  ) THEN
    CREATE POLICY "Allow all access to objetos_perdidos" ON public.objetos_perdidos FOR ALL USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'despachos_objetos_perdidos' AND policyname = 'Allow all access to despachos_objetos_perdidos'
  ) THEN
    CREATE POLICY "Allow all access to despachos_objetos_perdidos" ON public.despachos_objetos_perdidos FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
