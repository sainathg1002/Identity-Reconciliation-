import { Request, Response } from "express";
import {
  findContactsByEmailOrPhone,
  findContactsByPrimaryId,
  createContact,
  updateContact,
} from "../repository";
import { Contact, IdentifyRequest, IdentifyResponse } from "../types";

/**
 * Core identify endpoint that consolidates contacts
 */
export async function identify(req: Request, res: Response): Promise<void> {
  try {
    const { email, phoneNumber } = req.body as IdentifyRequest;

    // Validate that at least one field is provided
    if (!email && !phoneNumber) {
      res.status(400).json({ error: "Email or phoneNumber must be provided" });
      return;
    }

    // Step 1: Find all existing contacts matching email or phoneNumber
    const matchingContacts = await findContactsByEmailOrPhone(email || null, phoneNumber || null);

    let primaryContact: Contact;

    if (matchingContacts.length === 0) {
      // Step 2a: No contacts exist - create a new primary contact
      primaryContact = await createContact({
        email: email || null,
        phoneNumber: phoneNumber || null,
        linkedId: null,
        linkPrecedence: "primary",
      });
    } else {
      // Step 2b: Contacts exist - consolidate them
      primaryContact = await consolidateContacts(matchingContacts, email || null, phoneNumber || null);
    }

    // Step 3: Get all contacts related to the primary
    const allLinkedContacts = await findContactsByPrimaryId(primaryContact.id!);

    // Step 4: Build response
    const response = buildResponse(allLinkedContacts);

    res.status(200).json({ contact: response });
  } catch (error) {
    console.error("❌ Error in identify endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Consolidates matching contacts into a primary and secondary structure
 */
async function consolidateContacts(
  matchingContacts: Contact[],
  newEmail: string | null,
  newPhoneNumber: string | null
): Promise<Contact> {
  // Find the oldest contact (by created_at) to be the primary
  let primary = matchingContacts[0];
  for (const contact of matchingContacts) {
    if (new Date(contact.createdAt!) < new Date(primary.createdAt!)) {
      primary = contact;
    }
  }

  // Ensure the oldest contact is marked as primary and update others
  for (const contact of matchingContacts) {
    if (contact.id === primary.id) {
      // Ensure it's marked as primary
      if (contact.linkPrecedence !== "primary") {
        await updateContact(contact.id, { linkPrecedence: "primary", linkedId: null });
      }
    } else {
      // Make it secondary and link to primary if not already
      if (contact.linkPrecedence !== "secondary" || contact.linkedId !== primary.id) {
        await updateContact(contact.id, { linkPrecedence: "secondary", linkedId: primary.id });
      }
    }
  }

  // Step 2c: Check if incoming request has new information not in any contact
  const existingEmails = matchingContacts.map((c) => c.email).filter((e) => e !== null);
  const existingPhones = matchingContacts.map((c) => c.phoneNumber).filter((p) => p !== null);

  let hasNewEmail = newEmail && !existingEmails.includes(newEmail);
  let hasNewPhone = newPhoneNumber && !existingPhones.includes(newPhoneNumber);

  // If new information exists, create a secondary contact
  if (hasNewEmail || hasNewPhone) {
    await createContact({
      email: hasNewEmail ? newEmail : null,
      phoneNumber: hasNewPhone ? newPhoneNumber : null,
      linkedId: primary.id,
      linkPrecedence: "secondary",
    });
  }

  return primary;
}

/**
 * Builds the response object from all linked contacts
 */
function buildResponse(
  contacts: Contact[]
): IdentifyResponse["contact"] {
  // Find the primary contact
  const primary = contacts.find((c) => c.linkPrecedence === "primary");
  if (!primary || !primary.id) {
    throw new Error("No primary contact found");
  }

  // Collect all unique emails and phone numbers
  const emailSet = new Set<string>();
  const phoneSet = new Set<string>();

  for (const contact of contacts) {
    if (contact.email) emailSet.add(contact.email);
    if (contact.phoneNumber) phoneSet.add(contact.phoneNumber);
  }

  // Primary contact's email and phone should come first
  const emails: string[] = [];
  const phones: string[] = [];

  if (primary.email) emails.push(primary.email);
  emailSet.delete(primary.email!);
  emails.push(...Array.from(emailSet));

  if (primary.phoneNumber) phones.push(primary.phoneNumber);
  phoneSet.delete(primary.phoneNumber!);
  phones.push(...Array.from(phoneSet));

  // Get secondary contact IDs
  const secondaryIds = contacts
    .filter((c) => c.linkPrecedence === "secondary" && c.id !== primary.id)
    .map((c) => c.id!)
    .sort();

  return {
    primaryContatctId: primary.id,
    emails,
    phoneNumbers: phones,
    secondaryContactIds: secondaryIds,
  };
}
