-- Prevent concurrent fulfilment requests from recording or triggering
-- the same one-time automation more than once for a policy.
--
-- EMAIL_SENT, FINALIZE_RETRIED and other event types remain repeatable.

CREATE UNIQUE INDEX
  "PolicyEvent_welcome_once_per_policy"
ON "PolicyEvent" ("policyId")
WHERE "type" = 'WELCOME_AUTOMATION_TRIGGERED';

CREATE UNIQUE INDEX
  "PolicyEvent_newsletter_once_per_policy"
ON "PolicyEvent" ("policyId")
WHERE "type" = 'NEWSLETTER_CONTACT_ADDED';
