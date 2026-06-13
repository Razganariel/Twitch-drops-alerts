import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Charger .env, puis .env.local (qui surcharge en dev via override: true)
config({ path: ".env" });
config({ path: ".env.local", override: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
