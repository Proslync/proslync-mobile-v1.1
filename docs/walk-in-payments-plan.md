# Enable Tap to Pay for Walk-in Guests

## Context

The Collect Payments screen lets staff charge unpaid guests via Stripe Terminal Tap to Pay. Currently, only guests with a linked user account (`userId`) can be charged. Walk-in guests (checked in via ID scan or manual entry) have no app account and show a disabled "No account" badge.

This is backwards — registered users likely already bought tickets online. Walk-ins are the primary at-door payment use case. We need to allow Tap to Pay collection for all checked-in guests regardless of whether they have an account.

### Current Blockers

1. `Payment.userId` is `NOT NULL` — can't create payment without a user
2. `collectAtDoor()` throws `BadRequestException` if `guest.userId` is null
3. `getUnpaidAttendees()` query joins Payment on `user_id` — misses walk-ins
4. Stripe PaymentIntent creation requires a Stripe customer (derived from userId)
5. Mobile shows "No account" badge, disables Collect button when `canCollect: false`

### Key Insight

For Stripe Terminal `card_present` payments, the `customer` field is **optional**. Walk-ins don't need a Stripe customer. The link between payment and person is the `EventGuest.id` (guestId), not a user account.

## Files

| File | Action | Repo |
|------|--------|------|
| `src/payments/entities/payment.entity.ts` | Make `userId` nullable, add `guestId` column | backend |
| `src/payments/payments.service.ts` | Update `collectAtDoor()` + `processSuccessfulPayment()` | backend |
| `src/event-attendees/event-attendees.service.ts` | Fix `getUnpaidAttendees()` query | backend |
| `src/event-attendees/dto/unpaid-attendee.dto.ts` | Update `canCollect` description | backend |
| New migration file | Make userId nullable, add guest_id column + index | backend |
| `hooks/use-event-socket.ts` | Add `guestId` to `PaymentReceivedPayload` | mobile |
| `app/collect-payments.tsx` | Remove "No account" badge, update WebSocket handler | mobile |

## Changes

### 1. Migration — alter `payments` table

New file in `src/database/migrations/2026/`:

```sql
-- Up
ALTER TABLE "payments" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "payments" ADD "guest_id" integer;
CREATE INDEX "IDX_payments_guest_id" ON "payments" ("guest_id");
ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_guest_id"
  FOREIGN KEY ("guest_id") REFERENCES "event_guests"("id")
  ON DELETE SET NULL;

-- Down
ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_guest_id";
DROP INDEX "IDX_payments_guest_id";
ALTER TABLE "payments" DROP COLUMN "guest_id";
ALTER TABLE "payments" ALTER COLUMN "user_id" SET NOT NULL;
```

### 2. Payment entity — make userId nullable, add guestId

`src/payments/entities/payment.entity.ts`:

- Change `userId` column: `@Column({ type: 'int', name: 'user_id' })` → `@Column({ type: 'int', name: 'user_id', nullable: true })`
- Change type: `userId: number` → `userId?: number`
- Make user relation nullable: add `nullable: true` to `@ManyToOne(() => User, ...)`
- Add new column + relation after userId:

```typescript
@Column({ type: 'int', nullable: true, name: 'guest_id' })
@Index()
guestId?: number;

@ManyToOne(() => EventGuest, { onDelete: 'SET NULL', nullable: true })
@JoinColumn({ name: 'guest_id' })
guest?: EventGuest;
```

### 3. `collectAtDoor()` — remove userId requirement

`src/payments/payments.service.ts` (~lines 1353-1547):

**a) Remove the userId guard** (~line 1392-1396):
Delete the `if (!guest.userId) throw BadRequestException(...)` block.

**b) Existing payment check** (~line 1399-1408):
Branch by userId vs guestId:
```typescript
const existingWhere: any = { eventId, status: PaymentStatus.SUCCEEDED };
if (guest.userId) {
  existingWhere.userId = guest.userId;
} else {
  existingWhere.guestId = dto.guestId;
}
```

**c) Stripe customer** (~line 1472-1481):
Only create for registered users:
```typescript
let stripeCustomerId: string | undefined;
if (guest.userId) {
  // existing getOrCreateStripeCustomer logic
  stripeCustomerId = await this.getOrCreateStripeCustomer(guest.userId, email);
}
```

**d) PaymentIntent creation** (~line 1493-1508):
Conditionally include customer; always include guestId in metadata:
```typescript
const paymentIntent = await this.stripe.paymentIntents.create({
  amount: amountInCents,
  currency,
  ...(stripeCustomerId ? { customer: stripeCustomerId } : {}),
  payment_method_types: paymentMethodTypes,
  metadata: {
    eventId: eventId.toString(),
    ...(guest.userId ? { userId: guest.userId.toString() } : {}),
    guestId: dto.guestId.toString(),
    source: dto.useTerminal ? 'terminal_at_door' : 'at_door',
    collectedBy: staffUserId.toString(),
    // ...tier/pricing metadata unchanged
  },
});
```

**e) Payment record** (~line 1511-1528):
Include guestId, make userId conditional:
```typescript
const payment = this.paymentRepository.create({
  ...(guest.userId ? { userId: guest.userId } : {}),
  guestId: dto.guestId,
  eventId,
  // ...rest unchanged
});
```

### 4. `processSuccessfulPayment()` — handle walk-in payments

`src/payments/payments.service.ts` (~lines 523-817):

**a) Ticket creation** (~line 650-683):
Wrap in `if (payment.userId)` — walk-ins are already physically present, they don't need digital tickets:
```typescript
if (payment.userId) {
  // existing ticket creation logic
} else {
  this.logger.log(`Walk-in payment ${paymentIntentId}: skipping ticket creation (no user account)`);
}
```

**b) EventGuest update** (~line 733-762):
For walk-ins, find guest by `payment.guestId`:
```typescript
if (payment.guestId) {
  eventGuest = await eventGuestRepo.findOne({ where: { id: payment.guestId } });
} else if (payment.userId) {
  // existing logic: find by eventId + userId
}
```

**c) Referral tracking** (~line 789):
Guard with `if (payment.userId)` since referrals require a user.

**d) WebSocket broadcast** (~line 810-815):
Add guestId to payload:
```typescript
this.eventGateway.broadcastToEvent(payment.eventId, 'payment_received', {
  userId: payment.userId || null,
  guestId: payment.guestId || null,
  paymentId: payment.id,
  amount: payment.finalAmount,
  eventId: payment.eventId,
});
```

### 5. `getUnpaidAttendees()` — include walk-ins

`src/event-attendees/event-attendees.service.ts` (~lines 1573-1593):

**a) Fix the LEFT JOIN** to match by guestId OR userId:
```typescript
.leftJoin(
  Payment,
  'p',
  '(p.event_id = eg.eventId AND p.status = :succeededStatus) AND (p.guest_id = eg.id OR (p.user_id = eg.userId AND eg.userId IS NOT NULL))',
  { succeededStatus: 'succeeded' },
)
```

**b) Change `canCollect`** (~line 1609):
```typescript
canCollect: true,  // All checked-in guests can be collected from
```

### 6. Mobile: WebSocket payload type

`hooks/use-event-socket.ts` (~line 18-23):

```typescript
interface PaymentReceivedPayload {
  userId?: number | null;
  guestId?: number | null;
  paymentId: number;
  amount: number;
  eventId: number;
}
```

### 7. Mobile: Collect Payments screen

`app/collect-payments.tsx`:

**a) WebSocket handler** (~line 109-112):
Match by guestId (which is guest `id`) for walk-ins:
```typescript
onPaymentReceived: React.useCallback((data: { userId?: number | null; guestId?: number | null }) => {
  setGuests((prev) =>
    prev.filter((g) => {
      if (data.guestId && g.id === data.guestId) return false;
      if (data.userId && g.userId && g.userId === data.userId) return false;
      return true;
    })
  );
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}, []),
```

**b) Remove "No account" badge** (~line 204-217):
Always show the Collect button. Remove the `item.canCollect` conditional — just render `GlassButton` for all guests.

**c) Add "Walk-in" label** in the guest meta area for visual clarity:
```typescript
{!item.userId && (
  <Text style={styles.guestMetaText}>Walk-in</Text>
)}
```

**d) Clean up** unused `disabledBadge` and `disabledText` styles.

## Edge Cases

- **Existing payments unaffected** — all current rows have userId set. Migration only makes column nullable going forward.
- **EventEarnings** — uses `event.ownerId` (not `payment.userId`), so walk-in revenue still credited to organizer.
- **Refunds** — staff-initiated via admin path checking event ownership, not payment.userId. Works as-is.
- **Payment history** — queries by userId naturally exclude walk-in payments. Correct since walk-ins have no account to view history.
- **Walk-in creates account later** — not handled in this scope. Payment stays linked via guestId. Future enhancement could reconcile.

## Verification

1. Create a paid event with a ticket tier + pricing
2. Check in a walk-in guest (via manual check or ID scan, without linking membership card)
3. Open Collect Payments — walk-in guest appears with "Walk-in" label and active Collect button
4. Tap Collect → backend creates PaymentIntent without Stripe customer → returns clientSecret
5. Terminal shows "Ready to Tap" → simulated tap succeeds
6. Payment webhook fires → payment status updated, no ticket created, guest removed from unpaid list via WebSocket
7. Verify registered user flow still works unchanged
8. Verify same walk-in guest cannot be charged twice (duplicate payment check by guestId)
