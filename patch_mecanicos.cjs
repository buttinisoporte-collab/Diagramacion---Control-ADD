const fs = require('fs');
let code = fs.readFileSync('src/pages/Auxilios.tsx', 'utf8');

const target = `      setConductoresList(loadedCond);

    } catch (e) {
      console.error('Error loading master data for Auxilios:', e);`;

const replacement = `      setConductoresList(loadedCond);

      // 4. Mecánicos
      let loadedMec = [];
      if (supabase) {
        const { data } = await supabase.from('nomina_mecanicos').select('*');
        if (data && data.length > 0) loadedMec = data;
      }
      if (loadedMec.length === 0) {
        const local = localStorage.getItem('ext_store_nomina_mecanicos');
        if (local) loadedMec = JSON.parse(local);
      }
      setMecanicosList(loadedMec);

    } catch (e) {
      console.error('Error loading master data for Auxilios:', e);`;

code = code.replace(target, replacement);
fs.writeFileSync('src/pages/Auxilios.tsx', code);
