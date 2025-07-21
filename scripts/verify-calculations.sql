-- Script para verificar los cálculos de P&L
-- Basado en los datos de muestra actualizados

-- Mostrar todos los trades con cálculos detallados
SELECT 
    underlying,
    option_type,
    strike_price,
    premium_received,
    quantity,
    status,
    current_option_price,
    -- Cálculo del valor total de la prima recibida
    (premium_received * quantity * 100) as total_premium_received,
    -- Cálculo del P&L no realizado (solo para posiciones abiertas)
    CASE 
        WHEN status = 'open' AND current_option_price IS NOT NULL THEN
            (premium_received - current_option_price) * quantity * 100
        ELSE NULL
    END as unrealized_pnl,
    -- P&L realizado (solo para posiciones cerradas)
    profit_loss as realized_pnl
FROM trades
ORDER BY status, underlying;

-- Resumen de métricas principales
SELECT 
    'Total Premium Received' as metric,
    SUM(premium_received * quantity * 100) as value
FROM trades

UNION ALL

SELECT 
    'Realized P&L' as metric,
    COALESCE(SUM(profit_loss), 0) as value
FROM trades
WHERE status IN ('closed', 'expired')

UNION ALL

SELECT 
    'Unrealized P&L' as metric,
    COALESCE(SUM(
        CASE 
            WHEN status = 'open' AND current_option_price IS NOT NULL THEN
                (premium_received - current_option_price) * quantity * 100
            ELSE 0
        END
    ), 0) as value
FROM trades;

-- Desglose por posición abierta
SELECT 
    underlying,
    option_type,
    premium_received,
    current_option_price,
    quantity,
    (premium_received * quantity * 100) as premium_total,
    CASE 
        WHEN current_option_price IS NOT NULL THEN
            (premium_received - current_option_price) * quantity * 100
        ELSE 0
    END as unrealized_pnl
FROM trades
WHERE status = 'open'
ORDER BY underlying;

-- Verificación de cálculos esperados:
-- AAPL: (3.50 - 1.25) * 2 * 100 = $450
-- MSFT: (2.80 - 3.10) * 1 * 100 = -$30
-- NVDA: (8.75 - 2.15) * 1 * 100 = $660
-- Total Unrealized P&L: $450 + (-$30) + $660 = $1,080

-- Total Premium Received: 
-- AAPL: 3.50 * 2 * 100 = $700
-- MSFT: 2.80 * 1 * 100 = $280
-- TSLA: 5.20 * 1 * 100 = $520
-- NVDA: 8.75 * 1 * 100 = $875
-- SPY: 2.25 * 3 * 100 = $675
-- Total: $3,050

-- Realized P&L:
-- TSLA: $520
-- SPY: $675
-- Total: $1,195