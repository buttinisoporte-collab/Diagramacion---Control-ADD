const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const fecha = '2026-08-24';
  const { data, error } = await supabase
    .from('auxilios')
    .select('*')
    .or(`fecha.eq.${fecha},and(hora_llegada_base.is.null,fecha.lt.${fecha})`);
  
  if (error) console.error(error);
  else console.log(data);
}
test();
