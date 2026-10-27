/**
 * Tipos e interfaces de TypeScript para el sistema de medición de carbono de EcoTrack.
 */

// Categorías válidas permitidas para una medición de carbono
export type CarbonCategory = 'Transporte' | 'Energía' | 'Residuos';

// Interfaz principal para una medición de huella de carbono
export interface CarbonMeasurement {
  id: string;
  fuente: string;
  categoría: CarbonCategory;
  co2_producido: number; // Expresado en kilogramos de CO₂ equivalente (kg CO₂e)
}

// Tipo auxiliar para el formulario de creación (id generado por la app/DB)
export type CreateMeasurementInput = Omit<CarbonMeasurement, 'id'>;

// Fila de la tabla 'emisiones' en Supabase (soporta 'categoría' o 'categoria')
export interface EmissionRow {
  id: string;
  fuente: string;
  categoría?: CarbonCategory;
  categoria?: CarbonCategory;
  co2_producido: number;
  created_at?: string;
}

// Payload para insertar en la tabla 'emisiones'
export interface InsertEmissionPayload {
  fuente: string;
  categoría: CarbonCategory;
  co2_producido: number;
}

// Constante con las categorías disponibles para selects y validaciones
export const CARBON_CATEGORIES: CarbonCategory[] = ['Transporte', 'Energía', 'Residuos'];

