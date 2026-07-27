-- Schema for Transport Company
-- Execute this in your Supabase SQL Editor

-- 1. Tabla Nomina conductores
CREATE TABLE IF NOT EXISTS nomina_conductores (
    id_conductor UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legajo VARCHAR(50) UNIQUE NOT NULL,
    apellido_nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(100),
    dni VARCHAR(20) UNIQUE,
    licencia_conducir VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla Flota Activa
CREATE TABLE IF NOT EXISTS flota_activa (
    id_unidad UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unidad VARCHAR(50) UNIQUE NOT NULL,
    patente VARCHAR(20) UNIQUE NOT NULL,
    empresa VARCHAR(100),
    asientos INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabla Nomina mecánicos
CREATE TABLE IF NOT EXISTS nomina_mecanicos (
    id_mecanico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legajo VARCHAR(50) UNIQUE NOT NULL,
    apellido_nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(100),
    dni VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla Temporadas
CREATE TABLE IF NOT EXISTS temporadas (
    id_temporada UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabla Turnos
CREATE TABLE IF NOT EXISTS turnos (
    id_turno UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cod_turno VARCHAR(50) UNIQUE NOT NULL,
    grupo VARCHAR(50),
    frecuencia VARCHAR(50),
    turno VARCHAR(50),
    tipo_turno VARCHAR(50) CHECK (tipo_turno IN ('Urbano', 'Media', 'Larga')),
    servicio VARCHAR(100),
    hora_presentacion TIME,
    hora_salida_base TIME,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    hora_llegada_base TIME,
    queda_fuera VARCHAR(2) DEFAULT 'No',
    id_temporada UUID REFERENCES temporadas(id_temporada),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabla Feriados
CREATE TABLE IF NOT EXISTS feriados (
    id_feriado UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE UNIQUE NOT NULL,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabla Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(50) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- Note: Store hashed in production
    nombre_apellido VARCHAR(150) NOT NULL,
    dni VARCHAR(20),
    rol VARCHAR(50) CHECK (rol IN ('Administrador', 'Diagramador', 'Garita', 'Planific-Mantenimiento', 'Mecanico', 'Conductor')),
    estado VARCHAR(20) DEFAULT 'Activo' CHECK (estado IN ('Activo', 'Inactivo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabla Control Mecánico
CREATE TABLE IF NOT EXISTS control_mecanico (
    id_control_mecanico UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_turno UUID REFERENCES turnos(id_turno),
    id_mecanico UUID REFERENCES nomina_mecanicos(id_mecanico),
    id_unidad UUID REFERENCES flota_activa(id_unidad),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    flu_agua INTEGER CHECK (flu_agua BETWEEN 1 AND 5),
    flu_aceite INTEGER CHECK (flu_aceite BETWEEN 1 AND 5),
    flu_combustible INTEGER CHECK (flu_combustible BETWEEN 1 AND 5),
    flu_hidraulico INTEGER CHECK (flu_hidraulico BETWEEN 1 AND 5),
    flu_frenos INTEGER CHECK (flu_frenos BETWEEN 1 AND 5),
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabla Controles (Checklist Conductor)
CREATE TABLE IF NOT EXISTS controles (
    id_controles UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    id_unidad UUID REFERENCES flota_activa(id_unidad),
    id_turno UUID REFERENCES turnos(id_turno),
    id_conductor UUID REFERENCES nomina_conductores(id_conductor),
    id_control_mecanico UUID REFERENCES control_mecanico(id_control_mecanico), -- If mechanic did fluids
    -- Fluidos (only if mechanic didn't do it)
    flu_agua BOOLEAN,
    flu_aceite BOOLEAN,
    flu_combustible BOOLEAN,
    flu_hidraulico BOOLEAN,
    flu_frenos BOOLEAN,
    -- Seguridad
    seg_martillos BOOLEAN,
    seg_cint_seguridad BOOLEAN,
    seg_matafuego BOOLEAN,
    -- Luces
    luces_internas BOOLEAN,
    luces_externas BOOLEAN,
    luces_frenos BOOLEAN,
    luces_giros BOOLEAN,
    -- Equipamiento
    equ_calef_ac BOOLEAN,
    equ_cort_cabez BOOLEAN,
    equ_limp_parab BOOLEAN,
    equ_puertas BOOLEAN,
    equ_cristales_espejos BOOLEAN,
    equ_cubiertas BOOLEAN,
    equ_micronauta_sube BOOLEAN,
    equ_documentos BOOLEAN,
    obs_gral TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabla Diagramación
CREATE TABLE IF NOT EXISTS diagramacion (
    id_diag UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    id_turno UUID REFERENCES turnos(id_turno),
    id_unidad UUID REFERENCES flota_activa(id_unidad),
    id_conductor1 UUID REFERENCES nomina_conductores(id_conductor),
    id_conductor2 UUID REFERENCES nomina_conductores(id_conductor), -- For Larga distancia
    id_control_garita UUID, -- Will link later
    id_control_mecanico UUID REFERENCES control_mecanico(id_control_mecanico),
    id_checklist UUID REFERENCES controles(id_controles),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Tabla Control Garita
CREATE TABLE IF NOT EXISTS control_garita (
    id_control_garita UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_diag UUID REFERENCES diagramacion(id_diag),
    encargado UUID REFERENCES usuarios(id),
    presentacion_conductor BOOLEAN DEFAULT FALSE,
    salida_autorizada BOOLEAN DEFAULT FALSE,
    autorizado_por UUID REFERENCES usuarios(id), -- If authorized with missing checks
    fecha_hora_salida TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key reference back to diagramacion
ALTER TABLE diagramacion ADD CONSTRAINT fk_control_garita FOREIGN KEY (id_control_garita) REFERENCES control_garita(id_control_garita);
