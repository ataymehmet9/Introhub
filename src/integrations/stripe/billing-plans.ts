export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      'Unlimited contacts',
      '5 introduction requests per month',
      'Basic support',
    ],
  },
  pro: {
    name: 'Pro',
    price: 99,
    features: [
      'Unlimited contacts',
      'Unlimited introduction requests',
      'Priority support',
      'Advanced analytics',
    ],
  },
} as const
