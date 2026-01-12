# Stripe Integration Setup

## Products Created (Test Mode)

| Plan                   | Price         | Price ID                         |
| ---------------------- | ------------- | -------------------------------- |
| Voice Agent Starter    | CHF 29/month  | `price_1Soohn6bysxOOlngR8VsADtY` |
| Voice Agent Pro        | CHF 99/month  | `price_1SoolM6bysxOOlngDM1WsEIb` |
| Voice Agent Enterprise | CHF 299/month | `price_1SoomX6bysxOOlngfeWSpVUT` |

## Features by Plan

### Starter (CHF 29/month)

- 1,000 Voice Minutes
- 1 Voice Agent
- Basic Support
- Email Notifications

### Pro (CHF 99/month)

- 5,000 Voice Minutes
- 5 Voice Agents
- Priority Support
- Advanced Analytics
- Calendar Integration

### Enterprise (CHF 299/month)

- Unlimited Voice Minutes
- Unlimited Voice Agents
- 24/7 Dedicated Support
- Custom Branding
- API Access
- White-Label Option

## Environment Variables

Required in `.env` and Render:

- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID_STARTER`
- `STRIPE_PRICE_ID_PRO`
- `STRIPE_PRICE_ID_ENTERPRISE`
- `STRIPE_WEBHOOK_SECRET` (after webhook setup)

## Next Steps

1. ✅ Products created in Stripe
2. ✅ Price IDs added to environment
3. ⏳ Configure Stripe Webhooks
4. ⏳ Test checkout flow
5. ⏳ Implement customer portal
