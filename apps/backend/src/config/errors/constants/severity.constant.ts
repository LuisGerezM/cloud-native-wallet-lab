/**
 * Niveles de severidad de un error.
 *
 * Se usan para decidir el canal/urgencia del log y, eventualmente, para
 * disparar alertas (ej. severidad HIGH → notificar a un servicio de monitoreo).
 *
 * Agnóstico de framework: no importa nada de NestJS ni de ningún adaptador HTTP.
 */
export const SEVERITY = {
  /** Error esperado/controlado, sin impacto real (ej. validación de input). */
  LOW: 'LOW',
  /** Error recuperable pero que conviene observar (ej. recurso no encontrado). */
  MEDIUM: 'MEDIUM',
  /** Error grave/no esperado que SIEMPRE debe loguearse y, idealmente, alertar. */
  HIGH: 'HIGH',
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];
