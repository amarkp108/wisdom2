export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const regNo = req.query.regNo;
    const token = req.headers["authorization"];

    if (!regNo || !token) {
      return res.status(400).json({ error: "Missing regNo or authorization token" });
    }

    // User-specified hardcoded values
    const hardcodedId = "69f1ba00c11b580012879e36";
    const hardcodedEntity = "698ff0d25c7936000f751d88";
    const hardcodedSession = "2026-27";

    console.log(`Fetching student details for regNo: ${regNo} using hardcoded ID: ${hardcodedId}...`);
    
    const detailUrl = `https://fee2-api.odpay.in/api/view/student?id=${hardcodedId}&entity=${hardcodedEntity}&session=${hardcodedSession}&regNo=${encodeURIComponent(regNo)}`;
    
    const detailResponse = await fetch(detailUrl, {
      method: "GET",
      headers: { 
        "Authorization": token, 
        "Content-Type": "application/json" 
      },
    });
    
    const detailData = await detailResponse.json();
    return res.status(200).json(detailData);
  } catch (error) {
    console.error("Backend student fetch error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
