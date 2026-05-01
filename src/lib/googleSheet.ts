export type SheetRegistrationData = {
  regNo: string;
  course: string;
  section: string;
  clubs: string;
};

const SHEET_WEBHOOK_URL = import.meta.env.VITE_GOOGLE_SHEET_WEBHOOK_URL || "";

export async function submitRegistrationToGoogleSheet(data: SheetRegistrationData) {
  if (!SHEET_WEBHOOK_URL) {
    throw new Error("Missing VITE_GOOGLE_SHEET_WEBHOOK_URL");
  }

  await fetch(SHEET_WEBHOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      regNo: data.regNo,
      course: data.course,
      section: data.section,
      clubs: data.clubs,
    }).toString(),
  });

  return { success: true };
}
