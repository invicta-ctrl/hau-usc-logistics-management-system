# Request Center guide

Production status: operational. Department requester accounts use the protected
login; the public page itself must not expose internal data, account identifiers,
or provider configuration. Save private tracking references outside public
channels.

## Choose the request type

- **Event Logistics** is for an approved or proposed event/sub-event and may contain Food,
  Materials, and Venue & Equipment needs.
- **Catalog Restock** replenishes an existing Office Inventory or Pantry catalog item.

Both submit a review record. Neither path deducts stock, creates a physical receipt, or
confirms procurement or release.

## Event Logistics flow

1. Enter requester, department, priority, event series, event/sub-event, stage, title, date
   range, time, participants, and location context.
2. For an additional request, select an Original Request ID. The list is limited to the
   selected event series and event/sub-event.
3. Review Food, Materials, and Venue & Equipment together in Step 4. Complete any one, any
   two, or all three. An untouched section creates no child data.
4. Use predictive item search where a catalog match is relevant. Search accepts item name,
   product ID, alias, category, stock area, handling, and unit.
5. Read the proposed line route:
   - **Issue from Stock** means the current preview can satisfy the proposed quantity from
     available-to-promise stock.
   - **For Canvassing** means sourcing is required.
   - **Split Fulfillment** separates the currently satisfiable stock quantity from the
     quantity requiring sourcing.
6. Review the line summary and accuracy confirmation, then submit for DOL review.

Routing is advisory until server review. Current state is revalidated later; submission does
not reserve or move physical stock.

## Venue & Equipment boundary

Venue and Equipment is a request component, not a fourth committee. Requestable references
and effective routing must come from an approved external list. The repository does not
invent institutional venues, equipment, offices, contacts, approvers, or a booking promise.
The source-backed catalog is intentionally empty until approved data is configured, and the
feature flag fails closed for new specialized submissions. Existing stored children remain
readable. A constrained Other line remains pending classification.

## Catalog Restock flow

1. Search and select an existing active catalog item; typed but unselected text is not an
   item identity.
2. Enter the requested quantity, needed date, purpose, and available supporting details.
3. Submit for review. Receiving occurs later, line by line, through the authorized restock
   workflow and records each quantity received now against the cumulative total.

## Request-only safety

The request-only portal receives a sanitized bootstrap and does not expose internal
navigation, records, role controls, inventory history, or protected configuration. Internal
authorization still cannot be inferred from form visibility or request content.
