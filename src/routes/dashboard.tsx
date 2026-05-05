import { createFileRoute } from "@tanstack/react-router";
import { ClubSelectionForm } from "@/components/ClubSelectionForm";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Dashboard - Wisdom World School" },
    ],
  }),
});

function Dashboard() {
  return <ClubSelectionForm />;
}
