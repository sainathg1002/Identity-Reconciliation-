-- Migration: create contacts table
DROP TABLE IF EXISTS contacts;
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(255),
  linked_id INT REFERENCES contacts(id) ON DELETE SET NULL,
  link_precedence VARCHAR(20) NOT NULL CHECK (link_precedence IN ('primary', 'secondary')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
