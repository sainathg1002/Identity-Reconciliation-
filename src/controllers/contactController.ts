import { Request, Response } from 'express';
import { createContact, findByEmailOrPhone, updateLinkedId } from '../models/contactModel';

export const identifyContact = async (req: Request, res: Response) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Provide at least one of email or phoneNumber' });
    }

    // Find any existing contacts
    const existingContacts: any[] = await findByEmailOrPhone(email, phoneNumber);

    let primaryContact: any;
    let secondaryContacts: any[] = [];

    if (existingContacts.length === 0) {
      // Create new primary contact
      primaryContact = await createContact({
        email,
        phone_number: phoneNumber,
        linked_id: null,
        link_precedence: 'primary'
      });
    } else {
      // Find all related contacts
      const allRelatedContacts = existingContacts;

      // Determine the primary contact (earliest created)
      primaryContact = allRelatedContacts.find((c: any) => c.link_precedence === 'primary') || allRelatedContacts[0];

      // Convert others to secondary if needed
      for (const c of allRelatedContacts) {
        const cc: any = c;
        if (cc.id !== primaryContact.id && cc.link_precedence !== 'secondary') {
          await updateLinkedId(cc.id, primaryContact.id);
        }
      }

      // Add a new contact if this email/phone combination doesn’t exist
      const hasExact = allRelatedContacts.some((c: any) => c.email === email && c.phone_number === phoneNumber);
      if (!hasExact) {
        const newSecondary = await createContact({
          email,
          phone_number: phoneNumber,
          linked_id: primaryContact.id,
          link_precedence: 'secondary'
        });
        secondaryContacts.push(newSecondary);
      }

      secondaryContacts.push(...allRelatedContacts.filter((c: any) => c.link_precedence === 'secondary'));
    }

    // Consolidate response
    const allContacts = [primaryContact, ...secondaryContacts];
    const emails = Array.from(new Set(allContacts.map((c: any) => c.email).filter(Boolean)));
    const phoneNumbers = Array.from(new Set(allContacts.map((c: any) => c.phone_number).filter(Boolean)));
    const secondaryIds = allContacts
      .filter((c: any) => c.link_precedence === 'secondary')
      .map((c: any) => c.id);

    return res.status(200).json({
      contact: {
        primaryContatctId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryIds
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
