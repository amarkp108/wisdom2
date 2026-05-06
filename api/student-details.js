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

    const hardcodedEntity = "64b77babcc3c21610787b060";
    const session = "2026-27";

    const searchParams = new URLSearchParams({
      regNo: regNo,
      entity: hardcodedEntity,
      session: session,
    });
    
    let searchResponse = await fetch(`https://fee2-api.odpay.in/api/view/student/list?${searchParams.toString()}`, {
      method: "GET",
      headers: { "Authorization": token, "Content-Type": "application/json" },
    });

    let searchResult = await searchResponse.json();
    
    if (!searchResult.data || (Array.isArray(searchResult.data) && searchResult.data.length === 0)) {
      searchResponse = await fetch(`https://fee2-api.odpay.in/api/view/student?${searchParams.toString()}`, {
        method: "GET",
        headers: { "Authorization": token, "Content-Type": "application/json" },
      });
      searchResult = await searchResponse.json();
    }

    let studentId = null;
    if (Array.isArray(searchResult.data)) {
      studentId = searchResult.data[0]?._id;
    } else if (searchResult.data?._id) {
      studentId = searchResult.data._id;
    } else if (searchResult.data?.id) {
      studentId = searchResult.data.id;
    }
    
    if (studentId) {
      const detailUrl = `https://fee2-api.odpay.in/api/view/student?id=${studentId}&entity=${hardcodedEntity}&session=${session}&regNo=${encodeURIComponent(regNo)}`;
      
      const detailResponse = await fetch(detailUrl, {
        method: "GET",
        headers: { "Authorization": token, "Content-Type": "application/json" },
      });
      
      const detailData = await detailResponse.json();
      return res.status(200).json(detailData);
    } else {
      return res.status(200).json(searchResult);
    }
  } catch (error) {
    console.error("Backend student fetch error:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
}
