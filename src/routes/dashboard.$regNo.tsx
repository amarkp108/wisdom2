import { createFileRoute } from "@tanstack/react-router";
import { ClubSelectionForm } from "@/components/ClubSelectionForm";

export const Route = createFileRoute("/dashboard/$")({
  component: DashboardWithSplat,
  head: () => ({
    meta: [
      { title: "Dashboard - Wisdom World School" },
    ],
  }),
});

function DashboardWithSplat() {
  const params = Route.useParams() as any;
  const regNo = params["_"] || params["*"];
  return <ClubSelectionForm initialRegNo={regNo} />;
}
