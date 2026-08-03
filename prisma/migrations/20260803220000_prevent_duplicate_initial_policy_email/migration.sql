-- Only one initial fulfilment email may be claimed per policy.
-- EMAIL_SENT records created for later customer-requested retrievals
-- remain repeatable.

CREATE UNIQUE INDEX
  "PolicyEvent_initial_email_once_per_policy"
ON "PolicyEvent" ("policyId")
WHERE
  "type" = 'EMAIL_SENT'
  AND ("data"->>'source') = 'INITIAL_FULFILLMENT';
