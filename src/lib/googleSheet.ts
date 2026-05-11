export type SheetRegistrationData = {
  scholarNo: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  mobileNumber: string;
  grade: string;
  section: string;
  previousMember: string;
  previousPortfolio: string;
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
      scholarNo: data.scholarNo,
      studentName: data.studentName,
      fatherName: data.fatherName,
      motherName: data.motherName,
      mobileNumber: data.mobileNumber,
      grade: data.grade,
      section: data.section,
      previousMember: data.previousMember,
      previousPortfolio: data.previousPortfolio,
      clubs: data.clubs,
    }).toString(),
  });

  return { success: true };
}
