-- Allow email to be null since we now support phone-only registration
ALTER TABLE email_verification_codes ALTER COLUMN email DROP NOT NULL;
