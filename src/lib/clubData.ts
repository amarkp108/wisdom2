export interface Club {
  name: string;
  subClubs?: Club[];
  parentName?: string;
  isDesignation?: boolean;
}

export interface Domain {
  id: number;
  name: string;
  clubs: Club[];
  maxSelections: number;
}

export const domains: Domain[] = [
  {
    id: 1,
    name: "Grade 6",
    maxSelections: 1,
    clubs: [
      { name: "Class Representative" },
    ],
  },
  {
    id: 2,
    name: "Grade 7/8/9",
    maxSelections: 2,
    clubs: [
      { name: "Class Representative" },
      {
        name: "Portfolios",
        subClubs: [
          { name: "Head", isDesignation: true },
          { name: "Associate", isDesignation: true },
          { name: "Academic" },
          { name: "Discipline" },
          { name: "Cultural" },
          { name: "Assembly" },
          { name: "Oishi (canteen)" },
          { name: "Sports" },
          { name: "Information and Communication Technology (ICT)" },
          { name: "Pastoral" },
          { name: "Fine Arts" },
        ],
      },
    ],
  },
  {
    id: 3,
    name: "Grade 10/11/12",
    maxSelections: 3,
    clubs: [
      { name: "Class Representative" },
      {
        name: "Portfolios",
        subClubs: [
          { name: "Head", isDesignation: true },
          { name: "Associate", isDesignation: true },
          { name: "Academic" },
          { name: "Discipline" },
          { name: "Cultural" },
          { name: "Assembly" },
          { name: "Oishi (canteen)" },
          { name: "Sports" },
          { name: "Information and Communication Technology (ICT)" },
          { name: "Pastoral" },
          { name: "Fine Arts" },
        ],
      },
      { name: "Captain" },
    ],
  },
];
