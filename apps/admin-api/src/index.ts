import { createAdminApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const app = createAdminApp();

const server = app.listen(env.ADMIN_API_PORT, () => {
  console.log(`Kassa Admin API (admin-api) listening on http://localhost:${env.ADMIN_API_PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down admin-api gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
