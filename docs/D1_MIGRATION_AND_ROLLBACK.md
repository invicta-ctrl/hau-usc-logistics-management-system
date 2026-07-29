# D1 migration, reconciliation, and rollback

## Local proof

Local proof is allowed with the all-zero local binding and fictional records:

```powershell
npm run d1:migrations:apply:local
npm run d1:migrations:list:local
npm run d1:seed:local -- --output <absolute-private-seed.sql>
npm run d1:execute:local -- --file <absolute-private-seed.sql>
npm run build:cloudflare
npm run cloudflare:dev
```

The seed generator refuses repository paths. Local state under `.wrangler/` is ignored and is never staging evidence.

## Remote preconditions

Do not run `wrangler whoami`, inspect an account, access Google, or target remote D1 until all are true:

1. the exact candidate is committed and pushed and remote CI is green;
2. a private package outside Git validates with `phase3:authorization:check`;
3. Gate B approves read-only Cloudflare and Google preflight;
4. the private Wrangler and Google configurations identify staging only and contain no production binding;
5. Gate C approves backup, migrations, Sheet export, D1 import, and secret setup.

Stop on target drift, source/hash drift, missing backup capacity, denied/pending action, or any production reference.

## Staging migration sequence

1. Read back safe account, Worker, route, D1, rollback, Google operator, workbook, Drive-map, and window labels. Compare them with the private package without printing IDs.
2. Export the existing staging D1 database to a private outside-Git backup. Record its hash, safe label, database bookmark/time, candidate, and operator privately.
3. Prove that the backup is readable and that restore or Time Travel is available before mutation.
4. Export the approved Sheet snapshot read-only; validate candidate, tab counts, hashes, excluded fields, and classification.
5. Prepare private import/reconciliation SQL. Resolve every quarantined or rejected row through the approved disposition process.
6. Apply only the ordered `migrations/*.sql` files to the authorized staging binding.
7. Apply the private import SQL. Reapply it once to prove idempotency.
8. Run the private reconciliation SQL and the acceptance queries below. Preserve results privately and expose only redacted counts/hashes.
9. Deploy only after Gate D approves the exact Worker candidate. Set the cutover state only after full staging acceptance and rollback rehearsal.

## Mandatory reconciliation

- import batch source count equals imported plus explicitly approved rejected count;
- per-tab counts and hashes match the approved snapshot;
- no negative on-hand, reserved, or available-to-promise balance;
- no request line is over-received or over-released;
- no duplicate handoff, return, release confirmation, receiving record, or idempotency key;
- reservation consumption does not exceed reservation quantity;
- ledger/audit/status-history rows remain append-only;
- all account, role, capability, and committee assignments match the approved staging roster;
- every imported request, lending ticket, restock request, and deliverable has an approved committee assignment; missing or ambiguous legacy ownership remains fail-closed and blocks acceptance;
- D1 is the runtime source of truth and Sheet import is blocked after cutover.

Any mismatch stops writes and blocks deployment acceptance.

## Rollback rehearsal

Gate E authorization is required.

1. Record the serving candidate and a safe health/readiness snapshot.
2. Record the pre-test D1 backup/export hash and bookmark/time privately.
3. Execute only approved synthetic mutations and retain their correlation/idempotency labels.
4. Roll the Worker back to the approved preceding immutable version without changing production or creating an unrelated route.
5. Restore the staging D1 backup in an isolated authorized target, or prove the accepted Time Travel/forward-repair procedure if direct restore is not the selected mechanism.
6. Reconcile all mutations that occurred before rollback. Never delete or edit ledger, audit, history, receiving, release, or evidence rows as a repair.
7. Verify health, request-only privacy, login/role routing, authorization denial, inventory balances, and duplicate-retry behavior.
8. Record pass/fail, operator, time, candidate, backup label, and retained resources privately.

If restore cannot be proved, staging acceptance fails. Production promotion and PR merge remain prohibited.
