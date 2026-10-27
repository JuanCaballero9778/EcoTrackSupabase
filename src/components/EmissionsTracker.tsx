import React, { useState, useMemo } from 'react';
import { useEmissions } from '../hooks/useEmissions';
import type { 
  CarbonMeasurement, 
  CarbonCategory, 
  CreateMeasurementInput 
} from '../types/carbon';
import { CARBON_CATEGORIES } from '../types/carbon';
import { 
  Car, 
  Zap, 
  Trash2, 
  PlusCircle, 
  Leaf, 
  CloudFog, 
  TrendingUp, 
  Filter, 
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  Database
} from 'lucide-react';

/**
 * Configuración visual y semántica por categoría de emisión
 */
interface CategoryConfig {
  label: string;
  icon: React.ElementType;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
  iconBg: string;
  accentBorder: string;
}

const CATEGORY_CONFIG: Record<CarbonCategory, CategoryConfig> = {
  Transporte: {
    label: 'Transporte',
    icon: Car,
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40',
    badgeText: 'text-blue-700 dark:text-blue-300',
    badgeBorder: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    accentBorder: 'hover:border-blue-400 dark:hover:border-blue-600',
  },
  Energía: {
    label: 'Energía',
    icon: Zap,
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-700 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    accentBorder: 'hover:border-amber-400 dark:hover:border-amber-600',
  },
  Residuos: {
    label: 'Residuos',
    icon: Trash2,
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    accentBorder: 'hover:border-emerald-400 dark:hover:border-emerald-600',
  },
};

/**
 * Subcomponente optimizado y memorizado para cada Tarjeta (Card) de emisión individual.
 * Evita re-renders innecesarios al tipear en el formulario.
 */
interface EmissionCardProps {
  item: CarbonMeasurement;
}

const EmissionCard = React.memo<EmissionCardProps>(({ item }) => {
  const config = CATEGORY_CONFIG[item.categoría] || CATEGORY_CONFIG.Transporte;
  const IconComponent = config.icon;

  return (
    <article
      aria-label={`Medición: ${item.fuente}, categoría ${item.categoría}, ${item.co2_producido} kg de CO2`}
      className={`group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between ${config.accentBorder}`}
    >
      <div>
        {/* Badge de categoría */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${config.badgeBg} ${config.badgeText} ${config.badgeBorder}`}
          >
            <IconComponent className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{item.categoría}</span>
          </span>
        </div>

        {/* Fuente o actividad */}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug mb-4">
          {item.fuente}
        </h3>
      </div>

      {/* Indicador métrico de CO2 */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
            Emisión de CO₂
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {item.co2_producido.toLocaleString('es-ES', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 2,
              })}
            </span>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              kg CO₂e
            </span>
          </div>
        </div>

        <div 
          className={`p-2 rounded-xl ${config.iconBg} ${config.iconColor}`}
          aria-hidden="true"
        >
          <TrendingUp className="w-4 h-4" />
        </div>
      </div>
    </article>
  );
});

EmissionCard.displayName = 'EmissionCard';

/**
 * Componente Principal: EmissionsTracker
 */
export const EmissionsTracker: React.FC = () => {
  // Consumo del Custom Hook conectado a Supabase
  const { emissions, loading, error, fetchEmissions, insertEmission } = useEmissions();

  // Estado del filtro de categoría
  const [selectedFilter, setSelectedFilter] = useState<'Todas' | CarbonCategory>('Todas');

  // Estado del formulario tipado
  const [formData, setFormData] = useState<CreateMeasurementInput>({
    fuente: '',
    categoría: 'Transporte',
    co2_producido: 0,
  });

  // Estado de validaciones y notificación de éxito
  const [errors, setErrors] = useState<{ fuente?: string; co2_producido?: string }>({});
  const [isSuccessNotification, setIsSuccessNotification] = useState<boolean>(false);

  // Manejador tipado estrictamente para inputs de texto y numéricos
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'co2_producido' ? (value === '' ? 0 : parseFloat(value)) : value,
    }));

    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Manejador tipado estrictamente para el selector de categoría
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const value = e.target.value as CarbonCategory;
    setFormData((prev) => ({
      ...prev,
      categoría: value,
    }));
  };

  // Manejador tipado estrictamente para el envío del formulario (React.FormEvent)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    const newErrors: { fuente?: string; co2_producido?: string } = {};

    if (!formData.fuente.trim()) {
      newErrors.fuente = 'La fuente o actividad es obligatoria.';
    }

    if (formData.co2_producido <= 0 || isNaN(formData.co2_producido)) {
      newErrors.co2_producido = 'El valor de CO₂ debe ser un número positivo mayor a 0.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Inserción asíncrona en Supabase mediante el custom hook
    const result = await insertEmission({
      fuente: formData.fuente.trim(),
      categoría: formData.categoría,
      co2_producido: Number(formData.co2_producido.toFixed(2)),
    });

    if (result) {
      setFormData({
        fuente: '',
        categoría: 'Transporte',
        co2_producido: 0,
      });
      setErrors({});
      setIsSuccessNotification(true);
      setTimeout(() => setIsSuccessNotification(false), 3000);
    }
  };

  // =========================================================================
  // OPTIMIZACIÓN CON useMemo: Evitar recálculos y filtrados innecesarios
  // =========================================================================
  const filteredMeasurements = useMemo<CarbonMeasurement[]>(() => {
    if (selectedFilter === 'Todas') {
      return emissions;
    }
    return emissions.filter((item) => item.categoría === selectedFilter);
  }, [emissions, selectedFilter]);

  const totalCO2 = useMemo<number>(() => {
    return emissions.reduce((acc, curr) => acc + curr.co2_producido, 0);
  }, [emissions]);

  const totalFilteredCO2 = useMemo<number>(() => {
    return filteredMeasurements.reduce((acc, curr) => acc + curr.co2_producido, 0);
  }, [filteredMeasurements]);

  // Memorización de la lista de tarjetas renderizadas
  const renderedCards = useMemo(() => {
    return filteredMeasurements.map((item) => (
      <EmissionCard key={item.id} item={item} />
    ));
  }, [filteredMeasurements]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      
      {/* Header Superior y Métrica Global */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 mb-2">
              <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Módulo de Sostenibilidad</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              EmissionsTracker
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Registro y sincronización en tiempo real con Supabase para EcoTrack.
            </p>
          </div>

          <div 
            aria-label={`Total de CO2 acumulado: ${totalCO2.toFixed(1)} kilogramos de CO2 equivalente`}
            className="flex items-center gap-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-lg shadow-emerald-500/10"
          >
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm" aria-hidden="true">
              <CloudFog className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
                CO₂ Total Registrado
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight">
                  {totalCO2.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
                <span className="text-xs font-bold text-emerald-100">kg CO₂e</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          ESTADO DE ERROR: Mensaje visual si la petición al hook falla
          ========================================================================= */}
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 flex items-start justify-between gap-4 text-amber-900 dark:text-amber-200 text-sm shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold">Error al sincronizar con Supabase:</p>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">{error}</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                Verifica tus claves en <code className="font-mono font-semibold">.env</code> y que la tabla <code className="font-mono font-semibold">emisiones</code> esté creada en tu base de datos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchEmissions()}
            aria-label="Reintentar consultar emisiones de carbono en Supabase"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-200/80 dark:bg-amber-900/60 hover:bg-amber-300 dark:hover:bg-amber-800 text-xs font-bold text-amber-950 dark:text-amber-100 transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Grid Principal: Formulario a la izquierda + Listado a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* =========================================================================
            COLUMNA IZQUIERDA: Formulario con tipado estricto y accesibilidad completa
            ========================================================================= */}
        <section 
          aria-labelledby="form-heading" 
          className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 id="form-heading" className="text-lg font-bold text-slate-900 dark:text-white">
                Nueva Medición
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa y persiste los datos en la tabla <code className="font-mono text-emerald-600 dark:text-emerald-400">emisiones</code>.
              </p>
            </div>
          </div>

          {/* Notificación accesible de éxito */}
          {isSuccessNotification && (
            <div 
              role="status" 
              aria-live="polite"
              className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-300 transition-all"
            >
              <span>¡Medición registrada y sincronizada con éxito en Supabase!</span>
              <button 
                type="button" 
                onClick={() => setIsSuccessNotification(false)}
                aria-label="Cerrar notificación de confirmación"
                className="hover:opacity-75 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          )}

          <form 
            onSubmit={handleSubmit} 
            noValidate 
            aria-label="Formulario para registrar una nueva medición de huella de carbono"
            className="space-y-5"
          >
            {/* Input: Fuente */}
            <div>
              <label 
                htmlFor="fuente-input" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Fuente o Actividad <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <input
                id="fuente-input"
                name="fuente"
                type="text"
                placeholder="Ej. Flota de camiones, Generador diésel..."
                value={formData.fuente}
                onChange={handleInputChange}
                disabled={loading}
                aria-label="Fuente o actividad causante de la emisión"
                aria-required="true"
                aria-invalid={Boolean(errors.fuente)}
                aria-describedby={errors.fuente ? 'fuente-error-msg' : undefined}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.fuente 
                    ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-600 bg-rose-50/30' 
                    : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/50 dark:bg-slate-800/50'
                } text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60`}
              />
              {errors.fuente && (
                <p id="fuente-error-msg" role="alert" className="mt-1 text-xs text-rose-500 dark:text-rose-400">
                  {errors.fuente}
                </p>
              )}
            </div>

            {/* Selector: Categoría */}
            <div>
              <label 
                htmlFor="categoria-select" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Categoría <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <select
                  id="categoria-select"
                  name="categoría"
                  value={formData.categoría}
                  onChange={handleSelectChange}
                  disabled={loading}
                  aria-label="Selecciona la categoría de emisión de carbono"
                  aria-required="true"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 appearance-none cursor-pointer disabled:opacity-60"
                >
                  {CARBON_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-500" aria-hidden="true">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Input: CO2 Producido */}
            <div>
              <label 
                htmlFor="co2-input" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
              >
                CO₂ Producido <span className="text-rose-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <input
                  id="co2-input"
                  name="co2_producido"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.co2_producido === 0 ? '' : formData.co2_producido}
                  onChange={handleInputChange}
                  disabled={loading}
                  aria-label="Cantidad de dióxido de carbono producido en kilogramos"
                  aria-required="true"
                  aria-invalid={Boolean(errors.co2_producido)}
                  aria-describedby={errors.co2_producido ? 'co2-error-msg' : undefined}
                  className={`w-full pl-3.5 pr-20 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errors.co2_producido 
                      ? 'border-rose-400 focus:ring-rose-200 dark:border-rose-600 bg-rose-50/30' 
                      : 'border-slate-300 dark:border-slate-700 focus:border-emerald-500 focus:ring-emerald-200 bg-slate-50/50 dark:bg-slate-800/50'
                  } text-slate-900 dark:text-white placeholder:text-slate-400 disabled:opacity-60`}
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-slate-400" aria-hidden="true">
                  kg CO₂e
                </div>
              </div>
              {errors.co2_producido && (
                <p id="co2-error-msg" role="alert" className="mt-1 text-xs text-rose-500 dark:text-rose-400">
                  {errors.co2_producido}
                </p>
              )}
            </div>

            {/* Botón de acción con aria-label adaptativo y estado de carga */}
            <button
              type="submit"
              disabled={loading}
              aria-label={loading ? 'Guardando medición en la base de datos de Supabase' : 'Registrar nueva medición de carbono'}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm hover:shadow transition-all focus:outline-none focus:ring-2 focus:ring-slate-900/20 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Sincronizando con Supabase...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Registrar Medición</span>
                </>
              )}
            </button>
          </form>

          {/* Información de arquitectura */}
          <div className="mt-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              <strong>Persistencia Activa:</strong> Las mediciones se almacenan directamente en la tabla <code className="font-mono text-emerald-600 dark:text-emerald-400">emisiones</code> con Supabase y RLS.
            </span>
          </div>
        </section>

        {/* =========================================================================
            COLUMNA DERECHA: Listado y Grid de Tarjetas (con useMemo y estados)
            ========================================================================= */}
        <section 
          aria-labelledby="cards-heading" 
          aria-busy={loading}
          className="lg:col-span-7 space-y-6"
        >
          {/* Barra de Filtros */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span id="cards-heading" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Filtrar por:
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5" role="toolbar" aria-label="Filtros de categoría de emisión">
              {(['Todas', ...CARBON_CATEGORIES] as const).map((filter) => {
                const isActive = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setSelectedFilter(filter)}
                    aria-label={`Filtrar emisiones por la categoría ${filter}`}
                    aria-pressed={isActive}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Métricas rápidas de los datos calculados con useMemo */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Mostrando <strong>{filteredMeasurements.length}</strong> {filteredMeasurements.length === 1 ? 'medición' : 'mediciones'}
            </span>
            <span>
              Subtotal: <strong>{totalFilteredCO2.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg CO₂e</strong>
            </span>
          </div>

          {/* =========================================================================
              ESTADO VISUAL: Cargando... (cuando loading está activo y no hay datos)
              ========================================================================= */}
          {loading && emissions.length === 0 ? (
            <div 
              role="status" 
              aria-live="polite"
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Loader2 className="w-7 h-7 animate-spin" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Cargando emisiones...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Consultando la tabla <code className="font-mono text-emerald-600">emisiones</code> en Supabase. Un momento por favor.
              </p>
            </div>
          ) : filteredMeasurements.length === 0 ? (
            /* Estado Vacío */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400" aria-hidden="true">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                No hay mediciones para mostrar
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                No se encontraron registros en Supabase para el filtro seleccionado. Puedes agregar una nueva medición desde el formulario.
              </p>
              {selectedFilter !== 'Todas' && (
                <button
                  type="button"
                  onClick={() => setSelectedFilter('Todas')}
                  aria-label="Restablecer filtro a todas las categorías"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer transition-colors"
                >
                  Restablecer filtro
                </button>
              )}
            </div>
          ) : (
            /* Grid de Tarjetas Memorizadas */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {renderedCards}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
