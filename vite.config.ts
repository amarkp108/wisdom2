import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    tailwindcss(),
    {
      name: "hidden-login-api",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === "/api/hidden-login" && req.method === "POST") {
            try {
              console.log("Proxying login request to admission-api...");
              const response = await fetch("https://admission-api.odpay.in/login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  mobile: "7004743156",
                  password: "123456789",
                }),
              });

              const data = await response.json();
              console.log("Admission API Response:", JSON.stringify(data, null, 2));
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(data));
            } catch (error) {
              console.error("Backend login error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: "Internal server error" }));
            }
          } else if (req.url?.startsWith("/api/student-details") && req.method === "GET") {
            try {
              const url = new URL(req.url, `http://${req.headers.host}`);
              const regNo = url.searchParams.get("regNo");
              const token = req.headers["authorization"];

              if (!regNo || !token) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: "Missing regNo or authorization token" }));
                return;
              }

              const hardcodedEntity = "64b77babcc3c21610787b060";
              const session = "2026-27";

              console.log(`Searching for student ID by regNo: ${regNo}...`);
              
              // Step 1: Find student ID by regNo
              // We'll try both common search patterns
              const searchParams = new URLSearchParams({
                regNo: regNo,
                entity: hardcodedEntity,
                session: session,
              });
              
              console.log(`Step 1: Searching for student via /list...`);
              let searchResponse = await fetch(`https://fee2-api.odpay.in/api/view/student/list?${searchParams.toString()}`, {
                method: "GET",
                headers: { "Authorization": token, "Content-Type": "application/json" },
              });

              let searchResult = await searchResponse.json();
              
              // If /list didn't work, try a direct /student search or /student/search
              if (!searchResult.data || (Array.isArray(searchResult.data) && searchResult.data.length === 0)) {
                console.log(`Step 1b: /list empty, trying direct /student search...`);
                searchResponse = await fetch(`https://fee2-api.odpay.in/api/view/student?${searchParams.toString()}`, {
                  method: "GET",
                  headers: { "Authorization": token, "Content-Type": "application/json" },
                });
                searchResult = await searchResponse.json();
              }

              console.log("Search Result Body:", JSON.stringify(searchResult, null, 2));

              // Extract ID from different possible structures
              let studentId = null;
              if (Array.isArray(searchResult.data)) {
                studentId = searchResult.data[0]?._id;
              } else if (searchResult.data?._id) {
                studentId = searchResult.data._id;
              } else if (searchResult.data?.id) {
                studentId = searchResult.data.id;
              }
              
              if (studentId) {
                console.log(`Step 2: Found Student ID: ${studentId}. Fetching full details...`);
                const detailUrl = `https://fee2-api.odpay.in/api/view/student?id=${studentId}&entity=${hardcodedEntity}&session=${session}&regNo=${encodeURIComponent(regNo)}`;
                
                const detailResponse = await fetch(detailUrl, {
                  method: "GET",
                  headers: { "Authorization": token, "Content-Type": "application/json" },
                });
                
                const detailData = await detailResponse.json();
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(detailData));
              } else {
                console.log("No student ID found in search results.");
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(searchResult));
              }
            } catch (error) {
              console.error("Backend student fetch error:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: "Internal server error" }));
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
});
