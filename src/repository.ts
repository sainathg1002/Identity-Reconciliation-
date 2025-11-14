import pool from "./db";
import { Contact } from "./types";

/**
 * Find all contacts that match the email or phoneNumber
 */
export async function findContactsByEmailOrPhone(
  email: string | null,
  phoneNumber: string | null
): Promise<Contact[]> {
  let query = "SELECT * FROM contacts WHERE deleted_at IS NULL AND (";
  const conditions: string[] = [];
  const values: any[] = [];

  if (email) {
    conditions.push(`email = $${conditions.length + 1}`);
    values.push(email);
  }

  if (phoneNumber) {
    conditions.push(`phone_number = $${conditions.length + 1}`);
    values.push(phoneNumber);
  }

  if (conditions.length === 0) {
    return [];
  }

  query += conditions.join(" OR ") + ")";

  const result = await pool.query(query, values);
  return result.rows.map(rowToContact);
}

/**
 * Find a contact by ID
 */
export async function findContactById(id: number): Promise<Contact | null> {
  const result = await pool.query(
    "SELECT * FROM contacts WHERE id = $1 AND deleted_at IS NULL",
    [id]
  );
  return result.rows.length > 0 ? rowToContact(result.rows[0]) : null;
}

/**
 * Find all contacts linked to a primary contact (including the primary itself)
 */
export async function findContactsByPrimaryId(primaryId: number): Promise<Contact[]> {
  const result = await pool.query(
    `SELECT * FROM contacts 
     WHERE (id = $1 OR linked_id = $1) AND deleted_at IS NULL 
     ORDER BY created_at ASC`,
    [primaryId]
  );
  return result.rows.map(rowToContact);
}

/**
 * Create a new contact
 */
export async function createContact(contact: Contact): Promise<Contact> {
  const result = await pool.query(
    `INSERT INTO contacts (email, phone_number, linked_id, link_precedence, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [contact.email, contact.phoneNumber, contact.linkedId, contact.linkPrecedence]
  );
  return rowToContact(result.rows[0]);
}

/**
 * Update a contact's linkPrecedence and linkedId
 */
export async function updateContact(
  id: number,
  updates: Partial<Contact>
): Promise<Contact> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (updates.linkPrecedence !== undefined) {
    fields.push(`link_precedence = $${paramIndex++}`);
    values.push(updates.linkPrecedence);
  }

  if (updates.linkedId !== undefined) {
    fields.push(`linked_id = $${paramIndex++}`);
    values.push(updates.linkedId);
  }

  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) {
    // only updated_at, fetch and return
    const result = await pool.query("SELECT * FROM contacts WHERE id = $1", [id]);
    return rowToContact(result.rows[0]);
  }

  values.push(id);
  const query = `UPDATE contacts SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

  const result = await pool.query(query, values);
  return rowToContact(result.rows[0]);
}

/**
 * Convert database row to Contact interface
 */
function rowToContact(row: any): Contact {
  return {
    id: row.id,
    email: row.email || null,
    phoneNumber: row.phone_number || null,
    linkedId: row.linked_id || null,
    linkPrecedence: row.link_precedence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  };
}
