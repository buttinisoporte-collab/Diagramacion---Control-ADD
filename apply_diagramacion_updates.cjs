const fs = require('fs');

let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// 1. Add useRef and Upload / Download / FileUp icons if missing
if (!code.includes('useRef')) {
  code = code.replace("import { useState, useEffect, useMemo } from 'react';", "import { useState, useEffect, useMemo, useRef } from 'react';");
}

if (!code.includes('Upload')) {
  code = code.replace("import {\n  Calendar,", "import {\n  Upload,\n  FileUp,\n  Calendar,");
}

// 2. Add fileInputRef and CSV handlers inside Diagramacion component
const csvHandlersCode = `  // Ref for CSV upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download CSV Template Model
  const handleDownloadTemplate = () => {
    const headers = ['Código Turno', 'Unidad Asignada', 'Conductor Principal', '2do Conductor / Auxiliar', 'Observaciones'];
    const activeList = turnosDeFecha.length > 0 ? turnosDeFecha : turnos;
    
    const rows = activeList.map(t => {
      const a = assignments[t.cod_turno] || {};
      return [
        \`"\${t.cod_turno || ''}"\`,
        \`"\${a.unidad || ''}"\`,
        \`"\${a.conductor_principal || ''}"\`,
        \`"\${a.conductor_secundario || ''}"\`,
        \`"\${a.observaciones || ''}"\`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\\uFEFF' + [headers.join(','), ...rows].join('\\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', \`modelo_diagramacion_\${selectedDate}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('info', 'Modelo CSV descargado. Complete los datos y vuélvalo a cargar.');
  };

  // Upload CSV File and import assignments
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const rawLines = text.split(/\\r\\n|\\n/);
        const validLines = rawLines.filter(l => l.trim().length > 0);
        if (validLines.length < 2) {
          showToast('error', 'El archivo CSV está vacío o no contiene datos válidos.');
          return;
        }

        // Determine separator (, or ;)
        const headerLine = validLines[0];
        const separator = (headerLine.includes(';') && !headerLine.includes(',')) || 
                          (headerLine.split(';').length > headerLine.split(',').length) ? ';' : ',';

        // Parse line respecting quotes
        const parseLine = (line: string): string[] => {
          const cells: string[] = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === separator && !inQuotes) {
              cells.push(cur.trim().replace(/^"|"$/g, '').trim());
              cur = '';
            } else {
              cur += char;
            }
          }
          cells.push(cur.trim().replace(/^"|"$/g, '').trim());
          return cells;
        };

        const headers = parseLine(headerLine).map(h => h.toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, ""));
        
        let colCode = headers.findIndex(h => h.includes('codigo') || h.includes('cod') || h.includes('turno'));
        let colUnit = headers.findIndex(h => h.includes('unidad') || h.includes('coche') || h.includes('bus'));
        let colDriver1 = headers.findIndex(h => (h.includes('conductor') && !h.includes('2') && !h.includes('secundario') && !h.includes('auxiliar')) || h.includes('chofer') || h.includes('principal'));
        let colDriver2 = headers.findIndex(h => h.includes('2') || h.includes('secundario') || h.includes('auxiliar'));
        let colObs = headers.findIndex(h => h.includes('observaci') || h.includes('nota') || h.includes('comentario'));

        if (colCode === -1) colCode = 0;

        let importCount = 0;
        const newAssignments = { ...assignments };

        for (let i = 1; i < validLines.length; i++) {
          const row = parseLine(validLines[i]);
          if (!row || row.length === 0) continue;

          const rawCode = row[colCode] || '';
          if (!rawCode) continue;

          // Find matching shift code
          const matchedTurno = turnos.find(t => t.cod_turno.trim().toLowerCase() === rawCode.trim().toLowerCase());
          const codeKey = matchedTurno ? matchedTurno.cod_turno : rawCode.trim().toUpperCase();

          const unitVal = colUnit !== -1 ? (row[colUnit] || '') : '';
          const driver1Val = colDriver1 !== -1 ? (row[colDriver1] || '') : '';
          const driver2Val = colDriver2 !== -1 ? (row[colDriver2] || '') : '';
          const obsVal = colObs !== -1 ? (row[colObs] || '') : '';

          // Match unit name with flota list
          let matchedUnit = unitVal;
          if (unitVal) {
            const foundU = flota.find(f => f.unidad.toLowerCase() === unitVal.toLowerCase() || (f.patente && f.patente.toLowerCase() === unitVal.toLowerCase()));
            if (foundU) matchedUnit = foundU.unidad;
          }

          // Match driver name with conductores list
          let matchedDriver1 = driver1Val;
          if (driver1Val) {
            const foundC1 = conductores.find(c => 
              c.apellido_nombre.toLowerCase() === driver1Val.toLowerCase() || 
              (c.legajo && c.legajo.toLowerCase() === driver1Val.toLowerCase()) ||
              c.apellido_nombre.toLowerCase().includes(driver1Val.toLowerCase())
            );
            if (foundC1) matchedDriver1 = foundC1.apellido_nombre;
          }

          let matchedDriver2 = driver2Val;
          if (driver2Val) {
            const foundC2 = conductores.find(c => 
              c.apellido_nombre.toLowerCase() === driver2Val.toLowerCase() || 
              (c.legajo && c.legajo.toLowerCase() === driver2Val.toLowerCase()) ||
              c.apellido_nombre.toLowerCase().includes(driver2Val.toLowerCase())
            );
            if (foundC2) matchedDriver2 = foundC2.apellido_nombre;
          }

          newAssignments[codeKey] = {
            cod_turno: codeKey,
            fecha: selectedDate,
            unidad: matchedUnit,
            conductor_principal: matchedDriver1,
            conductor_secundario: matchedDriver2,
            observaciones: obsVal,
            estado: (matchedUnit && matchedDriver1) ? 'Completo' : 'Pendiente'
          };

          importCount++;
        }

        setAssignments(newAssignments);
        showToast('success', \`Se importaron \${importCount} asignaciones desde el CSV. Recuerde hacer clic en "Guardar Cambios".\`);
      } catch (err) {
        console.error('Error al procesar CSV:', err);
        showToast('error', 'Error al procesar el archivo CSV. Verifique el formato.');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsText(file, 'UTF-8');
  };
`;

// Insert csvHandlersCode before return statement
code = code.replace(
  "  // Export to CSV",
  `${csvHandlersCode}\n  // Export to CSV`
);

// Update Header actions
const oldHeaderButtons = `<button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Exportar a CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>`;

const newHeaderButtons = `
          {/* Hidden File Input for CSV Upload */}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".csv,.txt" 
            onChange={handleCSVUpload} 
            className="hidden" 
          />

          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 shadow-2xs transition-colors cursor-pointer"
            title="Descargar modelo CSV para llenar e importar"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Modelo CSV</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 shadow-2xs transition-colors cursor-pointer"
            title="Cargar asignaciones desde un archivo CSV"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Cargar CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
            title="Exportar a CSV / Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Exportar</span>
          </button>`;

code = code.replace(oldHeaderButtons, newHeaderButtons);

// Layout compacting adjustments:
// Replace main container padding
code = code.replace('<div className="flex-1 flex flex-col p-6 overflow-hidden space-y-4">', '<div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2">');

// Top bar padding
code = code.replace('rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">', 'rounded-lg p-2.5 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 border-slate-200">');

// Filter bar padding
code = code.replace('rounded-xl p-3 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">', 'rounded-lg p-2 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 border-slate-200">');

// Content view wrapper
code = code.replace('<div className="flex-1 overflow-y-auto pr-1">', '<div className="flex-1 min-h-0 flex flex-col overflow-hidden">');

// Table view container
code = code.replace('<div className="overflow-x-auto rounded-xl border border-slate-200">', '<div className="flex-1 min-h-0 overflow-auto rounded-lg border border-slate-200 bg-white shadow-2xs">');

// Table header sticky
code = code.replace('<thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">', '<thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 shadow-2xs">');

fs.writeFileSync('src/pages/Diagramacion.tsx', code);
console.log('Successfully updated Diagramacion.tsx');
