/**
 * This utility handles the background login to the admission API.
 * To keep the credentials hidden from the user, the actual API call 
 * is proxied through the Vite development server's middleware.
 */

export const loginAndGetToken = async () => {
  console.log("Attempting background login via local proxy...");
  
  try {
    const response = await fetch("/api/hidden-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Login failed:", errorText);
      return { success: false, error: "Login failed" };
    }

    const data = await response.json();
    console.log("Login successful");
    
    // Return the data which includes the token
    return { success: true, data };
  } catch (error) {
    console.error("Error during background login:", error);
    return { success: false, error: "Network or proxy error" };
  }
};

export const fetchStudentDetails = async (regNo: string) => {
  const token = sessionStorage.getItem("authToken");
  const entityId = sessionStorage.getItem("entityId");
  const userId = sessionStorage.getItem("userId");

  if (!token) {
    console.error("No auth token found in session storage");
    return { success: false, error: "Not authenticated" };
  }

  try {
    const params = new URLSearchParams({
      regNo: regNo,
      // The student id will be fetched on the backend using the regNo
      entity: entityId || "64b77babcc3c21610787b060", 
      session: "2026-27",
    });

    const response = await fetch(`/api/student-details?${params.toString()}`, {
      method: "GET",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch student details:", errorText);
      return { success: false, error: "Student not found or API error" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching student details:", error);
    return { success: false, error: "Network or proxy error" };
  }
};
