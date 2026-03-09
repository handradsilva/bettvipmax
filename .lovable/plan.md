

## Fix: PIX generation failing for withdrawal fee

### Problem
The `generate-pix` edge function has a minimum amount validation of R$ 20.00 (`amount < 20`), but the withdrawal fee is R$ 19.90 (`FEE_AMOUNT = 19.90`). This causes the function to return a 400 error: "Valor mínimo de R$ 20,00".

The `supabase.functions.invoke` wraps HTTP errors — the 400 response body ends up in `data` (not `error`), so `if (error) throw error` doesn't catch it, and the code proceeds with empty brcode values, showing a broken QR code screen.

### Fix (2 changes)

**1. `supabase/functions/generate-pix/index.ts` (line ~50)**
- Lower the minimum validation from `20` to `1` (or remove it), so the R$ 19.90 fee PIX can be generated.

**2. `src/pages/Withdraw.tsx` (line ~126)**
- Add proper error detection: check if `data?.error` exists (since `supabase.functions.invoke` puts non-2xx response bodies in `data`), and throw before proceeding.

### Why this happens
`supabase.functions.invoke()` only sets `error` for network-level failures. HTTP 400 responses still come back in `data`, so the current `if (error) throw error` check misses the API-level rejection entirely.

