# PROMPT DE SOLICITUD DE CÓDIGO FINANCIERO

Entorno:
- Lenguaje: Python 3.11+
- Framework: FastAPI 0.110+ / SQLAlchemy Core / Pydantic v2
- Base de datos: PostgreSQL
- (En este repo: equivalente Next.js 14 + Supabase + Zod; dinero = NUMERIC(14,2)/Decimal, nunca float)

Tarea:
[Describir la función o módulo, ej. "Crear el servicio de conciliación de transacciones bancarias entre extracciones de tarjeta y registros del sistema"]

Contrato de Datos:
- Input: Lista de objetos JSON / Pydantic Schema con [id_transaccion, monto, fecha, comercio, tenant_id]
- Output: Dict con {"conciliadas": list[str], "discrepancias": list[dict], "pendientes": list[str]}

Restricciones de Rendimiento y Escala:
- Debe procesar hasta 100,000 registros en menos de 100ms.
- Complejidad requerida: O(N) utilizando diccionarios/tablas hash.

Casos Borde a Manejar Obligatoriamente:
- Transacciones duplicadas
- Valores nulos (None) en monto o comercio
- Manejo numérico de precisión fija (utilizar Decimal para valores monetarios)

Entrega requerida:
1. Código limpio y tipado con Google Style Docstrings.
2. Manejo de excepciones defensivo (try/except específicos).
3. 3 test cases con pytest y parametrize.
