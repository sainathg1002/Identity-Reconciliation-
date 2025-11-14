#!/usr/bin/env node

/**
 * Simple migration runner script
 * Usage: node ./scripts/migrate.js
 * 
 * Reads SQL files from migrations/ folder and executes them in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(__dirname, '../migrations');

async function runMigrations() {
  try {
    console.log('🔄 Starting migrations...\n');

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found in migrations/ directory');
      return;
    }

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`📝 Running migration: ${file}`);
      
      try {
        const result = await pool.query(sql);
        console.log(`✅ Migration ${file} completed successfully\n`);
      } catch (err) {
        console.error(`❌ Migration ${file} failed:`, err.message);
        process.exit(1);
      }
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
