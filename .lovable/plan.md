

## Plan: Update Referral Link Domain to `.com.br`

**Change:** Update the referral link domain from `betvipmaxx.com` to `betvipmaxx.com.br` in one file.

### File: `src/pages/Affiliate.tsx` (line 64)
- Change `https://www.betvipmaxx.com/?ref=` → `https://www.betvipmaxx.com.br/?ref=`

That's the only place this domain is hardcoded. The tracking/admin side uses `referral_code` and `referred_by` fields from the database, which are domain-agnostic — no backend changes needed.

