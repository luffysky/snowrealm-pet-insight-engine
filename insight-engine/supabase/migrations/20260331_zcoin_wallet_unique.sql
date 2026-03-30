-- zcoin_wallets.user_id 加 UNIQUE constraint
-- 讓 ON CONFLICT (user_id) 可以正確運作
-- 2026-03-31

ALTER TABLE zcoin_wallets ADD CONSTRAINT uq_zcoin_wallet_user UNIQUE (user_id);
