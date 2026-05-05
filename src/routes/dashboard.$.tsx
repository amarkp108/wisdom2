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
  // Based on testing, the splat param in TanStack Router is stored under '*' or '_splat'
  const regNo = params["*"] || params["_splat"];
  
  return <ClubSelectionForm initialRegNo={regNo} />;
}
