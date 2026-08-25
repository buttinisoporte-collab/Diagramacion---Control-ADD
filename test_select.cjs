const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();
const sb = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await sb.from('control_mecanico').select('id_unidad, id_turno, turnos(cod_turno), flota_activa(unidad)').limit(5);
  console.log(data, error);
}
run();
