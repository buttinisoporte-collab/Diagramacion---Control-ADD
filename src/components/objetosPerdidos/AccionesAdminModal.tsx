import React, { useState, useEffect } from 'react';
import { ObjetoPerdido } from '../../types/objetosPerdidos';
import { 
  entregarATitular, 
  cambiarDeposito, 
  bajaPorDonacion, 
  destruirObjeto 
} from '../../lib/objetosPerdidosService';
import { Usuario } from '../../context/AuthContext';
import { 
  X, 
  UserCheck, 
  MapPin, 
  HeartHandshake, 
  Trash2, 
  AlertCircle, 
  Save, 
  Calendar, 
  FileText, 
  Phone, 
  Mail, 
  Home, 
  Package 
} from 'lucide-react';

export type TipoAccionAdmin = 'entrega_titular' | 'cambio_deposito' | 'baja_donacion' | 'destruccion';

interface AccionesAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoAccion: TipoAccionAdmin;
  objetos: ObjetoPerdido[]; // 1 item for individual actions, or 1+ for donacion masiva
  currentUser: Usuario;
  onSuccess: () => void;
}

export default function AccionesAdminModal({
  isOpen,
  onClose,
  tipoAccion,
  objetos,
  currentUser,
  onSuccess
}: AccionesAdminModalProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states for Entrega a Titular
  const [nroRegistroDoc, setNroRegistroDoc] = useState('');
  const [nombreTitular, setNombreTitular] = useState('');
  const [apellidoTitular, setApellidoTitular] = useState('');
  const [dniTitular, setDniTitular] = useState('');
  const [mailTitular, setMailTitular] = useState('');
  const [celularTitular, setCelularTitular] = useState('');
  const [direccionTitular, setDireccionTitular] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState(todayStr);

  // Form states for Cambio de Depósito
  const [nuevaUbicacion, setNuevaUbicacion] = useState('');

  // Form states for Baja por Donación
  const [nroRegistroDonacion, setNroRegistroDonacion] = useState('');
  const [fechaDonacion, setFechaDonacion] = useState(todayStr);
  const [institucionDonacion, setInstitucionDonacion] = useState('');
  const [obsDonacion, setObsDonacion] = useState('');

  // Form states for Destrucción
  const [nroRegistroDestruccion, setNroRegistroDestruccion] = useState('');
  const [fechaDestruccion, setFechaDestruccion] = useState(todayStr);
  const [motivoDestruccion, setMotivoDestruccion] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setFechaEntrega(new Date().toISOString().split('T')[0]);
      setFechaDonacion(new Date().toISOString().split('T')[0]);
      setFechaDestruccion(new Date().toISOString().split('T')[0]);
      if (objetos.length === 1 && tipoAccion === 'cambio_deposito') {
        setNuevaUbicacion(objetos[0].ubicacion_actual || '');
      }
    }
  }, [isOpen, tipoAccion, objetos]);

  if (!isOpen || objetos.length === 0) return null;

  const objetoPrincipal = objetos[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      if (tipoAccion === 'entrega_titular') {
        if (!nroRegistroDoc.trim()) throw new Error('Ingrese el N° de registro del documento físico firmado por el titular.');
        if (!nombreTitular.trim() || !apellidoTitular.trim() || !dniTitular.trim()) {
          throw new Error('Nombre, apellido y DNI son campos obligatorios.');
        }

        await entregarATitular(
          objetoPrincipal.id,
          {
            numero_registro_documento: nroRegistroDoc.trim(),
            nombre: nombreTitular.trim(),
            apellido: apellidoTitular.trim(),
            dni: dniTitular.trim(),
            mail: mailTitular.trim(),
            celular: celularTitular.trim(),
            direccion: direccionTitular.trim(),
            fecha_entrega: fechaEntrega,
            usuario_entrega: currentUser.nombre_apellido
          },
          currentUser
        );
      } else if (tipoAccion === 'cambio_deposito') {
        if (!nuevaUbicacion.trim()) throw new Error('Detalle la nueva ubicación donde se reubicará el artículo.');

        await cambiarDeposito(objetoPrincipal.id, nuevaUbicacion.trim(), currentUser);
      } else if (tipoAccion === 'baja_donacion') {
        if (!nroRegistroDonacion.trim()) throw new Error('Ingrese el N° de registro físico de donación.');
        if (!institucionDonacion.trim()) throw new Error('Ingrese el nombre de la institución destinataria.');

        const ids = objetos.map(o => o.id);
        await bajaPorDonacion(
          ids,
          {
            numero_registro_donacion: nroRegistroDonacion.trim(),
            fecha_donacion: fechaDonacion,
            institucion: institucionDonacion.trim(),
            observaciones: obsDonacion.trim(),
            usuario_donacion: currentUser.nombre_apellido
          },
          currentUser
        );
      } else if (tipoAccion === 'destruccion') {
        if (!nroRegistroDestruccion.trim()) throw new Error('Ingrese el N° de registro de destrucción.');
        if (!motivoDestruccion.trim()) throw new Error('Indique el motivo de la destrucción.');

        await destruirObjeto(
          objetoPrincipal.id,
          {
            numero_registro_destruccion: nroRegistroDestruccion.trim(),
            fecha_destruccion: fechaDestruccion,
            motivo: motivoDestruccion.trim(),
            usuario_destruccion: currentUser.nombre_apellido
          },
          currentUser
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al procesar la acción');
    } finally {
      setSaving(false);
    }
  };

  const getTitleInfo = () => {
    switch (tipoAccion) {
      case 'entrega_titular':
        return {
          title: 'Entrega a Titular / Propietario',
          subtitle: `Objeto ID: ${objetoPrincipal.id}`,
          icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
          color: 'bg-emerald-600'
        };
      case 'cambio_deposito':
        return {
          title: 'Cambio de Depósito / Reubicación',
          subtitle: `Objeto ID: ${objetoPrincipal.id}`,
          icon: <MapPin className="w-5 h-5 text-blue-400" />,
          color: 'bg-blue-600'
        };
      case 'baja_donacion':
        return {
          title: 'Baja Masiva por Donación',
          subtitle: `${objetos.length} objeto(s) seleccionado(s)`,
          icon: <HeartHandshake className="w-5 h-5 text-amber-400" />,
          color: 'bg-amber-600'
        };
      case 'destruccion':
        return {
          title: 'Baja por Destrucción',
          subtitle: `Objeto ID: ${objetoPrincipal.id}`,
          icon: <Trash2 className="w-5 h-5 text-rose-400" />,
          color: 'bg-rose-600'
        };
    }
  };

  const info = getTitleInfo();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`px-6 py-4 ${info.color} text-white flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black/20 rounded-xl">
              {info.icon}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{info.title}</h3>
              <p className="text-xs text-white/80">{info.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-black/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Objeto summary box */}
          {tipoAccion !== 'baja_donacion' && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{objetoPrincipal.descripcion}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700">
                  Planilla N°: {objetoPrincipal.numero_planilla}
                </span>
              </div>
              <p className="text-slate-500">
                Hallado el {objetoPrincipal.fecha_hallazgo} • Sector: {objetoPrincipal.sector_hallazgo} • {objetoPrincipal.unidad_interno}
              </p>
              <p className="text-blue-700 font-semibold pt-1">
                Ubicación actual: {objetoPrincipal.ubicacion_actual || 'Sin ubicación registrada'}
              </p>
            </div>
          )}

          {/* 1. ENTREGA A TITULAR */}
          {tipoAccion === 'entrega_titular' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    N° de Registro del Documento Físico Firmado *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. REC-ENT-2026-0045"
                    value={nroRegistroDoc}
                    onChange={(e) => setNroRegistroDoc(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Acta física de entrega firmada por el titular.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Fecha de Entrega *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaEntrega}
                    onChange={(e) => setFechaEntrega(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Datos de Quien Retira
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre del titular"
                      value={nombreTitular}
                      onChange={(e) => setNombreTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Apellido *</label>
                    <input
                      type="text"
                      required
                      placeholder="Apellido del titular"
                      value={apellidoTitular}
                      onChange={(e) => setApellidoTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">DNI / Documento *</label>
                    <input
                      type="text"
                      required
                      placeholder="Número de documento"
                      value={dniTitular}
                      onChange={(e) => setDniTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> Celular / Teléfono
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. +54 9 261 1234567"
                      value={celularTitular}
                      onChange={(e) => setCelularTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="correo@ejemplo.com"
                      value={mailTitular}
                      onChange={(e) => setMailTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <Home className="w-3 h-3 text-slate-400" /> Dirección
                    </label>
                    <input
                      type="text"
                      placeholder="Calle, número, ciudad"
                      value={direccionTitular}
                      onChange={(e) => setDireccionTitular(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. CAMBIO DE DEPÓSITO */}
          {tipoAccion === 'cambio_deposito' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  Nueva Ubicación en Depósito / Oficina *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detallar dónde se reubicará el artículo (ej. Armario 3, Repisa Superior, Depósito General de Custodia)..."
                  value={nuevaUbicacion}
                  onChange={(e) => setNuevaUbicacion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Se guardará como "UBICADO EN: [detalle]" y quedará registrado en la trazabilidad del objeto manteniendo su estado.
                </p>
              </div>
            </div>
          )}

          {/* 3. BAJA MASIVA POR DONACIÓN */}
          {tipoAccion === 'baja_donacion' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                <p className="font-bold flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-amber-700" />
                  Objetos seleccionados para donación masiva ({objetos.length}):
                </p>
                <ul className="mt-2 space-y-1 max-h-36 overflow-y-auto divide-y divide-amber-100">
                  {objetos.map((o, idx) => (
                    <li key={o.id ? `${o.id}-${idx}` : idx} className="pt-1 flex items-center justify-between text-[11px]">
                      <span><strong>{o.id}:</strong> {o.descripcion}</span>
                      <span className="text-amber-700 font-mono">Planilla {o.numero_planilla}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    N° de Registro Físico de Donación *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ACTA-DON-2026-012"
                    value={nroRegistroDonacion}
                    onChange={(e) => setNroRegistroDonacion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Acta para constancia cuando se requiera auditoría.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Fecha de Donación *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaDonacion}
                    onChange={(e) => setFechaDonacion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
                  Institución o Entidad Beneficiaria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Comedor Comunitario Los Álamos / Caritas / Escuela N° 4-080"
                  value={institucionDonacion}
                  onChange={(e) => setInstitucionDonacion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalle o persona que recibió la donación..."
                  value={obsDonacion}
                  onChange={(e) => setObsDonacion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* 4. DESTRUCCIÓN */}
          {tipoAccion === 'destruccion' && (
            <div className="space-y-4">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <p className="font-bold flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  Confirmación de Destrucción Física de Objeto
                </p>
                <p className="text-[11px] text-rose-700 mt-1">
                  Esta acción registrará la baja irreversible del objeto y cambiará su estado a <strong>"DESTRUIDO"</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    N° de Registro de Destrucción (Acta Física) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. ACTA-DEST-2026-003"
                    value={nroRegistroDestruccion}
                    onChange={(e) => setNroRegistroDestruccion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" />
                    Fecha de Destrucción *
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaDestruccion}
                    onChange={(e) => setFechaDestruccion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo de la Destrucción *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ej. Elemento en descomposición, roto sin valor, sustancia peligrosa o vencimiento de plazo reglamentario..."
                  value={motivoDestruccion}
                  onChange={(e) => setMotivoDestruccion(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-5 py-2.5 ${info.color} text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar y Confirmar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
