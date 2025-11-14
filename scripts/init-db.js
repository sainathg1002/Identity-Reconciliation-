#!/usr/bin/env node

/**
 * Database initialization script
 * 
 * This script sets up the PostgreSQL database for the identify-service.
 * It creates tables and initializes the schema.
 * 
 * Usage: node scripts/init-db.js
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "Error: DATABASE_URL environment variable not set. Please configure it in .env"
  );
  process.exit(1);
}

async function initializeDatabase() {
  const pool = new Pool({ connectionString });

  try {
    console.log("🔄 Initializing database...");
    console.log(`📍 Connection: ${connectionString.split("@")[1]}`);

    // Read migration file
    const migrationPath = path.join(__dirname, "../migrations/001_create_contacts_table.sql");
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    // Execute migration
    console.log("📝 Running migration: 001_create_contacts_table.sql");
    await pool.query(migrationSQL);

    // Verify table was created
    const result = await pool.query(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'contacts';"
    );

    if (result.rows[0].count > 0) {
      console.log("✅ Database initialized successfully!");
      console.log("📊 Table 'contacts' created/verified");

      // Show schema
      const schemaResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'contacts'
        ORDER BY ordinal_position;
      `);

      console.log("\n📋 Table Schema:");
      console.log("─".repeat(50));
      schemaResult.rows.forEach((col) => {
        const nullable = col.is_nullable === "YES" ? "nullable" : "NOT NULL";
        console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${nullable}`);
      });
      console.log("─".repeat(50));

      // Show row count
      const countResult = await pool.query("SELECT COUNT(*) FROM contacts;");
      console.log(`\n📈 Current records: ${countResult.rows[0].count}`);
    } else {
      console.error("❌ Failed to create contacts table");
      process.exit(1);
    }
  } catch (error) {
    if (error.code === "42P07") {
      // Table already exists - this is fine
      console.log("✅ Table 'contacts' already exists. No changes made.");
    } else {
      console.error("❌ Error initializing database:", error.message);
      console.error(error);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

// Run initialization
initializeDatabase().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
