-- Manual Database Initialization Script for Render
-- If postDeployCommand fails, you can run this manually via Render CLI

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(255),
  linked_id INT REFERENCES contacts(id) ON DELETE SET NULL,
  link_precedence VARCHAR(20) CHECK (link_precedence IN ('primary', 'secondary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone_number);
CREATE INDEX IF NOT EXISTS idx_contacts_linked_id ON contacts(linked_id);

-- Verify table
SELECT 'Table contacts created/verified' as status;
SELECT COUNT(*) as column_count FROM information_schema.columns WHERE table_name = 'contacts';
