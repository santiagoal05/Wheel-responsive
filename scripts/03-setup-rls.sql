-- Habilitar Row Level Security (RLS) para seguridad
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_positions ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (para desarrollo)
-- En producción, deberías crear políticas más específicas basadas en auth.uid()
CREATE POLICY "Allow all operations on trades" ON trades
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on stock_positions" ON stock_positions
    FOR ALL USING (true) WITH CHECK (true);

-- Para producción con autenticación, usarías algo como:
-- CREATE POLICY "Users can only access their own trades" ON trades
--     FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
