ALTER TABLE accounts ADD COLUMN profile_email_verified_at TEXT;

UPDATE accounts
SET profile_email_verified_at = onboarding_completed_at
WHERE onboarding_completed_at IS NOT NULL
  AND profile_email IS NOT NULL
  AND trim(profile_email) <> '';

CREATE UNIQUE INDEX uq_accounts_verified_profile_email
ON accounts(lower(profile_email))
WHERE profile_email_verified_at IS NOT NULL;

UPDATE app_metadata
SET value = '10', updated_at = '2026-07-22T14:40:00.000Z'
WHERE key = 'operational_schema_version';
