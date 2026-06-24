import "dotenv/config";
import { defineConfig } from "prisma/config";
import * as fs from "fs";

// Select seed command based on compilation status (production js vs development ts)
const seedCmd = fs.existsSync("dist/prisma/seed.js")
  ? "node dist/prisma/seed.js"
  : "ts-node prisma/seed.ts";

const dbUrl = process.env.DATABASE_URL || "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: seedCmd,
  },
  datasource: {
    url: dbUrl,
  },
});
