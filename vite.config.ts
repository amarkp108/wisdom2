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
              console.log("Direct API Response:", JSON.stringify(detailData, null, 2));
              
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(detailData));
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
