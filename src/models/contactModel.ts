import { pool } from '../config/db';

export interface Contact {
  id?: number;
  email?: string;
  phone_number?: string;
  linked_id?: number | null;
  link_precedence: 'primary' | 'secondary';
  created_at?: Date;
  updated_at?: Date;
}

export const findByEmailOrPhone = async (email?: string, phone?: string) => {
  const result = await pool.query(
    `SELECT * FROM contacts WHERE email = $1 OR phone_number = $2`,
    [email || null, phone || null]
  );
  return result.rows;
};

export const createContact = async (contact: Contact) => {
  const { email, phone_number, linked_id, link_precedence } = contact;
  const result = await pool.query(
    `INSERT INTO contacts (email, phone_number, linked_id, link_precedence)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, phone_number, linked_id, link_precedence]
  );
  return result.rows[0];
};

export const updateLinkedId = async (id: number, linkedId: number) => {
  await pool.query(`UPDATE contacts SET linked_id = $1 WHERE id = $2`, [linkedId, id]);
};
