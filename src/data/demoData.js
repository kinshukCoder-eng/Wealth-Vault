export const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Other",
];

export const money = (val) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export const demoState = {
  transactions: [
    { id: "t1", title: "Coffee", category: "Food", amount: 150, type: "expense", date: "2026-03-24" },
    { id: "t2", title: "Freelance", category: "Other", amount: 5000, type: "income", date: "2026-03-22" },
    { id: "t3", title: "Uber", category: "Transport", amount: 450, type: "expense", date: "2026-03-21" },
  ],
  goals: [
    { id: "g1", name: "New Phone", target: 60000, saved: 15000, monthly: 5000, emoji: "📱" },
  ],
};
