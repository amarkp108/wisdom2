/**
 * This utility handles the login to the OdPay API and authenticated requests.
 */

const API_BASE_URL = "https://api.odpay.in";

export const loginWithCredentials = async (mobile: string, password: string) => {
  console.log("Attempting login to OdPay...");
  
  // Use the local proxy if we want to hide credentials, or hit the API directly
  // The user asked to remove them from frontend, so we'll use a hidden approach
  try {
    const response = await fetch("/api/hidden-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Even though we pass them here, the Vite middleware handles it
      body: JSON.stringify({ mobile, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || errorData.error || "Login failed." 
      };
    }

    const data = await response.json();
    const resultData = data.data || data;
    const token = resultData.token;
    
    if (token) {
      sessionStorage.setItem("authToken", token);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error during login:", error);
    return { success: false, error: "Network error." };
  }
};

/**
 * Legacy login function - kept for compatibility but updated to use the new flow if needed.
 */
export const loginAndGetToken = async () => {
  // If we already have a token, we can just return success
  const token = sessionStorage.getItem("authToken");
  if (token) return { success: true, data: { token } };
  
  return { success: false, error: "No active session. Please log in." };
};

export const fetchStudentDetails = async (regNo: string) => {
  const token = sessionStorage.getItem("authToken");

  if (!token) {
    console.error("No auth token found in session storage");
    return { success: false, error: "Not authenticated" };
  }

  try {
    // The user mentioned subsequent API calls must include the token in Authorization header
    // Key: Authorization, Value: [Your_Token_Here]
    
    const params = new URLSearchParams({
      regNo: regNo,
      session: "2026-27",
    });

    // Use the local proxy to handle the specialized API request
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
    return { success: false, error: "Network error occurred" };
  }
};
