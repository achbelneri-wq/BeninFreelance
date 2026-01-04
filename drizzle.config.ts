import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql", // Le changement important !
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
