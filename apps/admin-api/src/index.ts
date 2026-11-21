import { createAdminApp } from "./app.js";
import { env } from "./config/env.js";

const app = createAdminApp();

app.listen(env.ADMIN_API_PORT, () => {
  console.log(`Kassa Admin API (admin-api) listening on http://localhost:${env.ADMIN_API_PORT}`);
});
