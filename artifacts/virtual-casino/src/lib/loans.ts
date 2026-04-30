export interface Loan {
  principal: number;
  takenAt: number;
  /** Per-day compounded interest, e.g. 0.05 = 5%/day. */
  dailyRate: number;
}

export const LOAN_TIERS = [
  {
    id: "small",
    name: "Pocket Loan",
    amount: 500,
    dailyRate: 0.04,
    blurb: "A friendly nudge.",
  },
  {
    id: "medium",
    name: "Felt Refill",
    amount: 2000,
    dailyRate: 0.06,
    blurb: "Enough for one good run.",
  },
  {
    id: "large",
    name: "High Roller",
    amount: 10000,
    dailyRate: 0.09,
    blurb: "The bank doesn't recommend it.",
  },
];

export function owedFor(loan: Loan, now = Date.now()): number {
  const days = Math.max(0, (now - loan.takenAt) / (1000 * 60 * 60 * 24));
  const total = loan.principal * Math.pow(1 + loan.dailyRate, days);
  return Math.ceil(total);
}

export function loanAgeHours(loan: Loan, now = Date.now()): number {
  return Math.max(0, (now - loan.takenAt) / (1000 * 60 * 60));
}

/** Pawn value for a shop item — typically 60% of price, rounded down. */
export function pawnValueFor(price: number): number {
  return Math.floor(price * 0.6);
}
