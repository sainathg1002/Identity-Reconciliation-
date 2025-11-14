import express, { Request, Response } from "express";
import { pool } from "../db";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { email, phoneNumber } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ message: "Either email or phoneNumber is required" });
  }

  try {
    // Find existing contacts
    const { rows: existingContacts } = await pool.query(
      `SELECT * FROM contacts WHERE email = $1 OR phone_number = $2`,
      [email, phoneNumber]
    );

    let primaryContactId: number;
    let emails: string[] = [];
    let phoneNumbers: string[] = [];
    let secondaryContactIds: number[] = [];

    if (existingContacts.length === 0) {
      // Create new primary contact
      const { rows } = await pool.query(
        `INSERT INTO contacts (email, phone_number, link_precedence)
         VALUES ($1, $2, 'primary') RETURNING *`,
        [email, phoneNumber]
      );
      primaryContactId = rows[0].id;
      emails = [rows[0].email];
      phoneNumbers = [rows[0].phone_number];
    } else {
      // Identify primary
      const primary = existingContacts.find(c => c.link_precedence === "primary") || existingContacts[0];
      primaryContactId = primary.id;

      // Create secondary if new info
      const alreadyExists =
        existingContacts.some(c => c.email === email) &&
        existingContacts.some(c => c.phone_number === phoneNumber);

      if (!alreadyExists) {
        const { rows } = await pool.query(
          `INSERT INTO contacts (email, phone_number, linked_id, link_precedence)
           VALUES ($1, $2, $3, 'secondary') RETURNING *`,
          [email, phoneNumber, primaryContactId]
        );
        existingContacts.push(rows[0]);
      }

      emails = Array.from(new Set(existingContacts.map(c => c.email).filter(Boolean)));
      phoneNumbers = Array.from(new Set(existingContacts.map(c => c.phone_number).filter(Boolean)));
      secondaryContactIds = existingContacts
        .filter(c => c.link_precedence === "secondary")
        .map(c => c.id);
    }

    res.status(200).json({
      contact: {
        primaryContactId,
        emails,
        phoneNumbers,
        secondaryContactIds,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;
