-- Crear tabla para trades de opciones
CREATE TABLE IF NOT EXISTS trades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    underlying VARCHAR(10) NOT NULL,
    option_type VARCHAR(4) CHECK (option_type IN ('put', 'call')) NOT NULL,
    strike_price DECIMAL(10,2) NOT NULL,
    expiration_date DATE NOT NULL,
    premium_received DECIMAL(10,2) NOT NULL,
    date_sold DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired', 'assigned')),
    current_price DECIMAL(10,2),
    profit_loss DECIMAL(10,2),
    assignment_price DECIMAL(10,2),
    cost_basis DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla para posiciones de acciones (cuando se asignan opciones)
CREATE TABLE IF NOT EXISTS stock_positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    underlying VARCHAR(10) NOT NULL,
    shares INTEGER NOT NULL,
    cost_basis DECIMAL(10,2) NOT NULL,
    current_price DECIMAL(10,2),
    trade_id UUID REFERENCES trades(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_trades_underlying ON trades(underlying);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_expiration ON trades(expiration_date);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_positions_underlying ON stock_positions(underlying);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at en trades
CREATE TRIGGER update_trades_updated_at 
    BEFORE UPDATE ON trades 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en stock_positions
CREATE TRIGGER update_stock_positions_updated_at 
    BEFORE UPDATE ON stock_positions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
