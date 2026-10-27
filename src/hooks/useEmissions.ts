import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { 
  CarbonMeasurement, 
  CreateMeasurementInput, 
  CarbonCategory,
  EmissionRow 
} from '../types/carbon';

export interface UseEmissionsReturn {
  emissions: CarbonMeasurement[];
  loading: boolean;
  error: string | null;
  fetchEmissions: () => Promise<void>;
  insertEmission: (newEmission: CreateMeasurementInput) => Promise<CarbonMeasurement | null>;
}

/**
 * Custom Hook para gestionar las emisiones de carbono con Supabase.
 * Proporciona el estado de mediciones, carga, errores y funciones asíncronas para lectura e inserción.
 */
export const useEmissions = (): UseEmissionsReturn => {
  const [emissions, setEmissions] = useState<CarbonMeasurement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Helper para normalizar los registros provenientes de la base de datos
   * (asegura compatibilidad tanto si la columna se llama 'categoría' como 'categoria')
   */
  const mapRowToMeasurement = (row: EmissionRow): CarbonMeasurement => ({
    id: String(row.id),
    fuente: row.fuente,
    categoría: (row.categoría || row.categoria || 'Transporte') as CarbonCategory,
    co2_producido: Number(row.co2_producido),
  });

  /**
   * Función asíncrona para obtener las mediciones desde la tabla 'emisiones' de Supabase
   */
  const fetchEmissions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('emisiones')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (data) {
        const formattedData: CarbonMeasurement[] = (data as EmissionRow[]).map(mapRowToMeasurement);
        setEmissions(formattedData);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error inesperado al consultar las emisiones de carbono en Supabase.';
      setError(errorMessage);
      console.error('[useEmissions] Error en fetchEmissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Función asíncrona para insertar un nuevo registro en la tabla 'emisiones' de Supabase
   */
  const insertEmission = useCallback(async (
    newEmission: CreateMeasurementInput
  ): Promise<CarbonMeasurement | null> => {
    setLoading(true);
    setError(null);

    try {
      // Inserción en la tabla 'emisiones'
      const { data, error: supabaseError } = await supabase
        .from('emisiones')
        .insert([
          {
            fuente: newEmission.fuente,
            categoría: newEmission.categoría,
            co2_producido: newEmission.co2_producido,
          },
        ])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error('No se recibió confirmación del registro insertado.');
      }

      const formattedRecord = mapRowToMeasurement(data as EmissionRow);

      // Actualizamos optimistamente el estado local prependiendo el nuevo registro
      setEmissions((prev) => [formattedRecord, ...prev]);

      return formattedRecord;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Error inesperado al insertar la medición en Supabase.';
      setError(errorMessage);
      console.error('[useEmissions] Error en insertEmission:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos automáticamente al montar el hook
  useEffect(() => {
    fetchEmissions();
  }, [fetchEmissions]);

  return {
    emissions,
    loading,
    error,
    fetchEmissions,
    insertEmission,
  };
};
