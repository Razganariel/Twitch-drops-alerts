import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Charger .env, puis .env.local (qui surcharge en dev)
config({ path: ".env" });
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"]!,
  },
});
