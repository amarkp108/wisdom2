import { createFileRoute } from "@tanstack/react-router";
import { ClubSelectionForm } from "@/components/ClubSelectionForm";

type DashboardSearch = {
  regNo?: string;
};

export const Route = createFileRoute("/dashboard")({
  validateSearch: (search: Record<string, unknown>): DashboardSearch => {
    return {
      regNo: (search.regNo as string) || undefined,
    };
  },
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard - Wisdom World School" },
    ],
  }),
});

function Dashboard() {
  const { regNo } = Route.useSearch();
  return <ClubSelectionForm initialRegNo={regNo} />;
}
