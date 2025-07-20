-- Add fields for automatic price updates
ALTER TABLE trades ADD COLUMN IF NOT EXISTS current_option_price DECIMAL(10,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMP WITH TIME ZONE;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS price_source VARCHAR(50) DEFAULT 'manual';

-- Create index for faster price updates
CREATE INDEX IF NOT EXISTS idx_trades_open_for_updates ON trades(status, underlying, option_type, strike_price, expiration_date) 
WHERE status = 'open';

-- Add function to track price update history
CREATE TABLE IF NOT EXISTS price_update_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    old_price DECIMAL(10,4),
    new_price DECIMAL(10,4),
    source VARCHAR(50) DEFAULT 'alpaca',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for price history
CREATE INDEX IF NOT EXISTS idx_price_log_trade_id ON price_update_log(trade_id);
CREATE INDEX IF NOT EXISTS idx_price_log_updated_at ON price_update_log(updated_at);
