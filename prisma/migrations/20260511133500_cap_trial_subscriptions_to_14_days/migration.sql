UPDATE "Subscription"
SET
  "expiresAt" = "startDate" + INTERVAL '14 days',
  "status" = 'trial'
WHERE
  "plan" = 'trial'
  AND "expiresAt" > "startDate" + INTERVAL '14 days';
