export interface Club {
  name: string;
}

export interface Domain {
  id: number;
  name: string;
  clubs: Club[];
}

export const domains: Domain[] = [
  {
    id: 1,
    name: "Economics",
    clubs: [
      { name: "Impact of Government Campaigns on Country's PPC" },
      { name: "Solution of Central Problems for India" },
      { name: "Some Recent Economic Problems faced by India" },
    ],
  },
  {
    id: 2,
    name: "Business Studies",
    clubs: [
      { name: "Primary Industries in India" },
      { name: "Secondary Industries in India" },
      { name: "Economics Activities" },
    ],
  },
  {
    id: 3,
    name: "Accountancy",
    clubs: [
      { name: "Accounting Terms: Assets, Liabilities, Capital, Drawing, Entity" },
      {
        name: "Accounting Terms: Revenue, Expenses, Capital Expenditure, Revenue Expenditure, Business Transactions",
      },
      { name: "Rules of Debit and Credit as per Modern and Traditional Approach" },
    ],
  },
];
