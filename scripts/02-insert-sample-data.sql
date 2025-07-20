-- Insertar datos de ejemplo para probar
INSERT INTO trades (
    underlying, 
    option_type, 
    strike_price, 
    expiration_date, 
    premium_received, 
    date_sold, 
    quantity, 
    status, 
    current_price
) VALUES 
    ('AAPL', 'put', 180.00, '2024-02-16', 3.50, '2024-01-15', 2, 'open', 185.50),
    ('MSFT', 'call', 420.00, '2024-02-09', 2.80, '2024-01-10', 1, 'open', 415.20),
    ('TSLA', 'put', 200.00, '2024-01-19', 5.20, '2023-12-20', 1, 'expired', 210.30),
    ('NVDA', 'put', 500.00, '2024-03-15', 8.75, '2024-01-20', 1, 'open', 520.00),
    ('SPY', 'put', 470.00, '2024-02-02', 2.25, '2024-01-05', 3, 'closed', 475.00);

-- Actualizar profit_loss para trades cerrados
UPDATE trades 
SET profit_loss = 520.00 
WHERE underlying = 'TSLA' AND status = 'expired';

UPDATE trades 
SET profit_loss = 675.00 
WHERE underlying = 'SPY' AND status = 'closed';
