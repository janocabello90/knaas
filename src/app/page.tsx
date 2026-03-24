import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect based on role
  switch (user.role) {
    case "SUPERADMIN":
      redirect("/admin");
      break;
    case "MENTOR":
      redirect("/mentor");
      break;
    case "ALUMNO":
      if (!user.onboardingDone) {
        redirect("/alumno/onboarding");
      }
      redirect("/alumno/programa");
      break;
    default:
      redirect("/login");
  }
}
