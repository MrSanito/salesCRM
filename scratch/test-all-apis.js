const { loadEnvConfig } = require('@next/env');
const projectDir = process.cwd();
loadEnvConfig(projectDir);

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-me";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // Fetch a user to authenticate as: vishalni2004@gmail.com (Org Admin)
    const user = await prisma.user.findFirst({
      where: { email: "vishalni2004@gmail.com" }
    });

    if (!user) {
      console.error("Test user vishalni2004@gmail.com not found!");
      return;
    }

    console.log(`Authenticating as: ${user.email} (Role: ${user.role})`);
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, organizationId: user.organizationId },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Fetch a lead to test single lead endpoints
    const lead = await prisma.lead.findFirst({
      where: { organizationId: user.organizationId }
    });

    if (!lead) {
      console.warn("No leads found for organization. Single lead tests will be skipped.");
    }

    const endpoints = [
      { path: "/api/auth/me", method: "GET" },
      { path: "/api/team", method: "GET" },
      { path: "/api/leads", method: "GET" },
      { path: "/api/leads/super-list", method: "GET" },
      { path: "/api/leads/distinct-filters", method: "GET" },
      { path: "/api/leads/sources", method: "GET" },
      { path: "/api/leads/industries", method: "GET" },
      { path: "/api/sidebar-filters", method: "GET" },
      { path: "/api/calendar", method: "GET" },
      { path: "/api/proposals", method: "GET" },
      { path: "/api/reminders", method: "GET" },
      { path: "/api/settings/pipeline", method: "GET" },
      { path: "/api/reports/audit", method: "GET" },
      { path: "/api/dashboard/stats", method: "GET" }
    ];

    if (lead) {
      endpoints.push({ path: `/api/leads/${lead.id}`, method: "GET" });
      endpoints.push({ path: `/api/leads/${lead.id}/audit`, method: "GET" });
    }

    console.log("\nStarting API verification checks...\n");

    for (const ep of endpoints) {
      const url = `http://localhost:3000${ep.path}`;
      try {
        const response = await fetch(url, {
          method: ep.method,
          headers: {
            "Cookie": `token=${token}`,
            "Content-Type": "application/json"
          }
        });

        const status = response.status;
        let data = null;
        if (response.headers.get("content-type")?.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        if (response.ok) {
          console.log(`[PASS] ${ep.method} ${ep.path} -> Status ${status}`);
        } else {
          console.error(`[FAIL] ${ep.method} ${ep.path} -> Status ${status}. Error:`, data);
        }
      } catch (err) {
        console.error(`[ERROR] ${ep.method} ${ep.path} -> Connection/Fetch Failed.`, err.message);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
