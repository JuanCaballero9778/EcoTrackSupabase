import type { CarbonMeasurement } from '../types/carbon';

export const MOCK_CARBON_MEASUREMENTS: CarbonMeasurement[] = [
  {
    id: 'meas-001',
    fuente: 'Flota de camionetas de reparto urbano',
    categoría: 'Transporte',
    co2_producido: 420.5,
  },
  {
    id: 'meas-002',
    fuente: 'Consumo eléctrico planta principal (horario pico)',
    categoría: 'Energía',
    co2_producido: 890.0,
  },
  {
    id: 'meas-003',
    fuente: 'Desechos de embalaje no reciclable',
    categoría: 'Residuos',
    co2_producido: 135.2,
  },
  {
    id: 'meas-004',
    fuente: 'Vuelos comerciales del equipo de operaciones',
    categoría: 'Transporte',
    co2_producido: 610.8,
  },
  {
    id: 'meas-005',
    fuente: 'Sistemas de refrigeración y aire acondicionado',
    categoría: 'Energía',
    co2_producido: 340.4,
  },
  {
    id: 'meas-006',
    fuente: 'Merma orgánica de comedor corporativo',
    categoría: 'Residuos',
    co2_producido: 78.6,
  },
];
