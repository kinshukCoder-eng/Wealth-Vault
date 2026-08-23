export function derive(transactions) {
  let income = 0;
  let spending = 0;
  let balance = 0;
  const categories = {};

  transactions.forEach((t) => {
    if (t.type === "income") {
      income += t.amount;
      balance += t.amount;
    } else {
      spending += t.amount;
      balance -= t.amount;

      if (!categories[t.category]) {
        categories[t.category] = 0;
      }
      categories[t.category] += t.amount;
    }
  });

  const budget = income * 0.8; // Example budget
  const remaining = budget - spending;
  const score = Math.max(0, Math.min(100, Math.round((remaining / budget) * 100)));
  const projected = spending * 1.2; // Example projection

  return {
    balance,
    income,
    spending,
    remaining,
    score,
    categories,
    budget,
    projected,
  };
}
