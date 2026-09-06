export interface DisputeInput {
  transaction_id: string;
  transaction_date: string;
  station: string;
  amount: number;
  is_duplicate: boolean;
  matched_trip_id?: string | null;
  trip_details?: {
    origin?: string;
    destination?: string;
    pickup_time?: string;
    dropoff_time?: string;
    provider?: string;
  } | null;
}

export function generateDisputeReport(input: DisputeInput): string {
  const {
    transaction_id,
    transaction_date,
    station,
    amount,
    is_duplicate,
    trip_details,
  } = input;

  const fecha = new Date(transaction_date).toLocaleDateString("es-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hora = new Date(transaction_date).toLocaleTimeString("es-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  let report = `
========================================
REPORTE DE DISPUTA DE PEAJE E-ZPASS
========================================

IDENTIFICADOR OFICIAL: ${transaction_id}
ESTACIÓN: ${station}
FECHA Y HORA: ${fecha} a las ${hora}
MONTO DISPUTADO: $${amount.toFixed(2)}
TIPO DE ALERTA: ${is_duplicate ? "DUPLICADO" : "FRAUDE / COBRO INDEBIDO"}

----------------------------------------
EVIDENCIA TÉCNICA DE GPS
----------------------------------------
`;

  if (trip_details && trip_details.origin && trip_details.destination) {
    report += `
El conductor se encontraba en un viaje activo durante la ventana temporal del peaje:

  PLATAFORMA: ${trip_details.provider || "N/A"}
  ORIGEN: ${trip_details.origin}
  DESTINO: ${trip_details.destination}
  HORA PICKUP: ${trip_details.pickup_time || "N/A"}
  HORA DROPOFF: ${trip_details.dropoff_time || "N/A"}

EVIDENCIA: El peaje en ${station} a las ${hora} fue cobrado de forma
${is_duplicate ? "DUPLICADA" : "FRAUDULENTA"}, ya que el conductor se
encontraba en una ubicación geográfica distinta durante ese momento,
comprobado por el registro GPS del viaje arriba indicado.
`;
  } else {
    report += `
No se encontró un viaje activo en la ventana temporal del peaje.
Esto sugiere que el cobro es fraudulento o corresponde a un vehículo
distinto registrado bajo la misma cuenta E-ZPass.
`;
  }

  report += `
----------------------------------------
SOLICITUD FORMAL
----------------------------------------

Por la presente, solicito la investigación y reversión inmediata del
cobro identificado como ${transaction_id} por un monto de $${amount.toFixed(2)},
realizado en ${station} el ${fecha} a las ${hora}.

Adjunto evidencia de geolocalización GPS que demuestra la imposibilidad
física de haber transitado por dicha estación en el momento indicado.

Atentamente,
Conductor de Plataforma

========================================
`;

  return report.trim();
}
