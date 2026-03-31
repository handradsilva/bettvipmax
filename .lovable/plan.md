

## Problema
Existem **duas versões** de cada função no banco — uma sem parâmetros (com `LIMIT 10000`) e outra com `_offset/_limit`. O Supabase pode estar chamando a versão sem parâmetros, limitando a 10.000 registros.

## Solução
1. **Dropar as versões sem parâmetros** das 3 funções (`admin_get_all_profiles()`, `admin_get_all_transactions()`, `admin_get_all_referrals()`) para garantir que apenas as versões paginadas sejam usadas.

2. **Aumentar o cap por página** de 1000 para 5000 nas versões paginadas (acelera a busca, menos round-trips).

3. O frontend (`useAdminData.ts`) já faz loop até esgotar os dados — isso garante leitura **ilimitada** independente do tamanho do banco.

## Arquivo modificado
- **Migration SQL**: `DROP FUNCTION` das versões sem parâmetros + `CREATE OR REPLACE` das paginadas com cap de 5000.

## Resultado
Leitura efetivamente ilimitada: o frontend busca 5000 por vez até trazer 100% dos registros.

