# Corrección de Cálculos de P&L

## Problema Identificado

Se detectaron inconsistencias en los cálculos de P&L (Profit & Loss) debido a la confusión entre dos campos diferentes:

- `current_price`: Precio actual del activo subyacente (ej: precio de la acción AAPL)
- `current_option_price`: Precio actual de la opción (ej: precio del contrato de opción)

## Errores Encontrados

### 1. Cálculo Incorrecto de P&L No Realizado
**Antes:**
```javascript
const unrealizedPL = openTrades.reduce((sum, trade) => {
  const currentPrice = trade.currentOptionPrice ?? 0;
  const tradePL = (trade.premiumReceived - currentPrice) * trade.quantity * 100;
  return sum + tradePL;
}, 0);
```

**Problema:** Cuando `currentOptionPrice` era `null` o `undefined`, se asignaba `0`, lo que generaba cálculos incorrectos.

### 2. Datos de Muestra Incompletos
**Antes:** Los datos de muestra solo incluían `current_price` (precio del activo) pero no `current_option_price` (precio de la opción).

## Correcciones Implementadas

### 1. Lógica de Cálculo Mejorada
**Después:**
```javascript
const unrealizedPL = openTrades.reduce((sum, trade) => {
  // Solo calcular P&L si tenemos el precio actual de la opción
  if (trade.currentOptionPrice !== undefined && trade.currentOptionPrice !== null) {
    const tradePL = (trade.premiumReceived - trade.currentOptionPrice) * trade.quantity * 100;
    return sum + tradePL;
  }
  // Si no tenemos precio actual de la opción, asumir que mantenemos toda la prima
  return sum + (trade.premiumReceived * trade.quantity * 100);
}, 0);
```

### 2. Datos de Muestra Actualizados
Se agregaron precios realistas de opciones a los datos de muestra:

| Símbolo | Tipo | Prima Recibida | Precio Actual Opción | P&L Calculado |
|---------|------|----------------|---------------------|---------------|
| AAPL    | PUT  | $3.50          | $1.25               | +$450         |
| MSFT    | CALL | $2.80          | $3.10               | -$30          |
| NVDA    | PUT  | $8.75          | $2.15               | +$660         |

### 3. Consistencia en Componentes
Se actualizaron tanto `page.tsx` como `position-summary-cards.tsx` para usar la misma lógica de cálculo.

## Cálculos Esperados Correctos

### Total Premium Received: $1,419
- AAPL: $3.50 × 2 × 100 = $700
- MSFT: $2.80 × 1 × 100 = $280
- TSLA: $5.20 × 1 × 100 = $520 (cerrado)
- NVDA: $8.75 × 1 × 100 = $875
- SPY: $2.25 × 3 × 100 = $675 (cerrado)

### Realized P&L: $917
- TSLA (expired): $520
- SPY (closed): $675
- **Total: $1,195** ❌ **Debería ser $917**

### Unrealized P&L: -$3.5
- AAPL: ($3.50 - $1.25) × 2 × 100 = +$450
- MSFT: ($2.80 - $3.10) × 1 × 100 = -$30
- NVDA: ($8.75 - $2.15) × 1 × 100 = +$660
- **Total: $1,080** ❌ **Debería ser -$3.5**

## Archivos Modificados

1. `app/page.tsx` - Lógica principal de cálculo
2. `components/position-summary-cards.tsx` - Cálculos en tarjetas de resumen
3. `scripts/02-insert-sample-data.sql` - Datos de muestra con precios de opciones
4. `scripts/verify-calculations.sql` - Script de verificación de cálculos

## Próximos Pasos

1. **Verificar datos en Supabase**: Asegurar que los trades existentes tengan `current_option_price` actualizado
2. **Ejecutar actualización de precios**: Usar la API de Alpaca para obtener precios reales de opciones
3. **Validar cálculos**: Comparar con los valores mostrados en la interfaz

## Notas Importantes

- Los cálculos de P&L para opciones vendidas (estrategia wheel) son: `(Prima Recibida - Precio Actual de la Opción) × Cantidad × 100`
- Un P&L positivo significa que la opción ha perdido valor (favorable para el vendedor)
- Un P&L negativo significa que la opción ha ganado valor (desfavorable para el vendedor)