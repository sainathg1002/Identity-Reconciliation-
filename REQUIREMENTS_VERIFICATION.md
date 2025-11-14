# Identify Service - Requirements Verification Checklist

## Overview
This document verifies that the identify-service implementation satisfies all requirements from the specification.

---

## ✅ REQUIREMENT 1: Endpoint & Request Format
**Requirement:** POST /identify endpoint accepts JSON with optional `email` and `phoneNumber` fields

**Implementation Status:** ✅ SATISFIED
- ✓ Route defined in `src/routes/identifyRoutes.ts` at POST `/identify`
- ✓ Request body parsed as JSON via `body-parser` middleware
- ✓ Types defined in `src/types.ts` with optional fields:
  ```typescript
  export interface IdentifyRequest {
    email?: string;
    phoneNumber?: string;
  }
  ```
- ✓ Controller validates at least one field provided (email OR phoneNumber)

**How to Verify:**
```powershell
# Test with email only
$body = ConvertTo-Json @{email='test@example.com'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -ContentType 'application/json' -Body $body

# Test with phone only
$body = ConvertTo-Json @{phoneNumber='123456'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -ContentType 'application/json' -Body $body
```

---

## ✅ REQUIREMENT 2: Response Format
**Requirement:** HTTP 200 response with JSON containing:
- `primaryContatctId` (number)
- `emails` (array, primary email first)
- `phoneNumbers` (array, primary phone first)
- `secondaryContactIds` (array of secondary IDs)

**Implementation Status:** ✅ SATISFIED
- ✓ Response interface defined in `src/types.ts`:
  ```typescript
  export interface IdentifyResponse {
    contact: {
      primaryContatctId: number;
      emails: string[];
      phoneNumbers: string[];
      secondaryContactIds: number[];
    };
  }
  ```
- ✓ Built in `src/controllers/identifyController.ts` function `buildResponse()`
- ✓ Primary contact's email and phone appear first in arrays
- ✓ Arrays contain unique values only

**How to Verify:**
Run the test script and check response structure:
```powershell
.\test-identify.ps1
```

---

## ✅ REQUIREMENT 3: No Existing Contacts → Create Primary
**Requirement:** If no contacts exist matching email or phone, create new contact with:
- `linkPrecedence = "primary"`
- `linkedId = null`

**Implementation Status:** ✅ SATISFIED
- ✓ Implemented in `src/controllers/identifyController.ts` function `identify()`
- ✓ Line: `if (matchingContacts.length === 0) { ... createContact(...) }`
- ✓ Creates with `linkPrecedence: "primary"` and `linkedId: null`

**How to Verify:**
```powershell
# Test 1: Create primary
$body = ConvertTo-Json @{email='newuser@example.com'; phoneNumber='555555'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json' | ConvertTo-Json -Depth 5

# Expected: primaryContatctId = new ID, secondaryContactIds = []
```

---

## ✅ REQUIREMENT 4: Secondary Contact Creation
**Requirement:** If incoming request has email OR phone matching existing contact, but contains NEW information, create secondary contact with:
- `linkPrecedence = "secondary"`
- `linkedId = primary.id`

**Implementation Status:** ✅ SATISFIED
- ✓ Implemented in `src/controllers/identifyController.ts` function `consolidateContacts()`
- ✓ Checks for new email not in existing contacts
- ✓ Checks for new phone not in existing contacts
- ✓ Creates secondary if `hasNewEmail || hasNewPhone`
- ✓ Links to primary via `linkedId`

**How to Verify:**
```powershell
# Step 1: Create primary with email + phone
$body = ConvertTo-Json @{email='contact1@example.com'; phoneNumber='111111'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Step 2: Send request with same phone but NEW email
$body = ConvertTo-Json @{email='contact2@example.com'; phoneNumber='111111'}
$response = Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Expected: secondaryContactIds contains the new contact ID
# Expected: emails array contains both: ['contact1@example.com', 'contact2@example.com']
```

---

## ✅ REQUIREMENT 5: Primary Can Become Secondary
**Requirement:** If multiple primary contacts exist and one request links them, the OLDER one stays primary, NEWER becomes secondary

**Implementation Status:** ✅ SATISFIED
- ✓ Implemented in `src/controllers/identifyController.ts` function `consolidateContacts()`
- ✓ Finds oldest by: `if (new Date(contact.createdAt!) < new Date(primary.createdAt!))`
- ✓ Updates other primaries: `updateContact(...{ linkPrecedence: "secondary", linkedId: primary.id })`
- ✓ Ensures `updatedAt` is set to current time

**How to Verify:**
```powershell
# Step 1: Create Primary #1
$body = ConvertTo-Json @{email='george@hillvalley.edu'; phoneNumber='919191'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Step 2: Create Primary #2 (will be created with later timestamp)
$body = ConvertTo-Json @{email='biffsucks@hillvalley.edu'; phoneNumber='717171'}
Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Step 3: Send request linking both (email from #1, phone from #2)
$body = ConvertTo-Json @{email='george@hillvalley.edu'; phoneNumber='717171'}
$response = Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Expected: primaryContatctId = 1 (older)
# Expected: secondaryContactIds = [2] (newer became secondary)
# Expected: emails = ['george@hillvalley.edu', 'biffsucks@hillvalley.edu'] (primary email first)
# Expected: phoneNumbers = ['919191', '717171'] (primary phone first)
```

---

## ✅ REQUIREMENT 6: Request With Null Email
**Requirement:** Request with `null` email and valid phone should return consolidated contact

**Implementation Status:** ✅ SATISFIED
- ✓ `IdentifyRequest` interface allows `email?: string` (optional)
- ✓ Controller checks `if (!email && !phoneNumber)` to reject invalid cases
- ✓ Accepts `null` email if phone is provided
- ✓ Uses phone to find matching contacts

**How to Verify:**
```powershell
# If primary contact exists with phone='123456'
$body = ConvertTo-Json @{email=$null; phoneNumber='123456'}
$response = Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Expected: Returns consolidated primary contact and any linked secondaries
```

---

## ✅ REQUIREMENT 7: Request With Null Phone
**Requirement:** Request with valid email and `null` phone should return consolidated contact

**Implementation Status:** ✅ SATISFIED
- ✓ Same logic as Requirement 6, but for phone field
- ✓ Controller searches by email when phone is null

**How to Verify:**
```powershell
# If primary contact exists with email='contact@example.com'
$body = ConvertTo-Json @{email='contact@example.com'; phoneNumber=$null}
$response = Invoke-RestMethod -Uri 'http://localhost:3000/identify' -Method Post -Body $body -ContentType 'application/json'

# Expected: Returns consolidated primary contact and any linked secondaries
```

---

## ✅ REQUIREMENT 8: Unique Email & Phone Arrays
**Requirement:** Email and phone arrays should be unique (no duplicates)

**Implementation Status:** ✅ SATISFIED
- ✓ Implemented in `src/controllers/identifyController.ts` function `buildResponse()`
- ✓ Uses `Set<string>` to ensure uniqueness:
  ```typescript
  const emailSet = new Set<string>();
  for (const contact of contacts) {
    if (contact.email) emailSet.add(contact.email);
  }
  ```

---

## ✅ REQUIREMENT 9: Primary Data First in Arrays
**Requirement:** Primary contact's email appears first in emails array, phone appears first in phoneNumbers array

**Implementation Status:** ✅ SATISFIED
- ✓ Implemented in `buildResponse()` function
- ✓ Primary email added first:
  ```typescript
  if (primary.email) emails.push(primary.email);
  emailSet.delete(primary.email!);
  emails.push(...Array.from(emailSet));
  ```
- ✓ Same logic for phone numbers

---

## ✅ REQUIREMENT 10: Database Schema
**Requirement:** Contacts table with columns:
- id (PK)
- email (nullable)
- phoneNumber (nullable)
- linkedId (FK to contacts.id, nullable)
- linkPrecedence ('primary' | 'secondary')
- createdAt
- updatedAt
- deletedAt (nullable)

**Implementation Status:** ✅ SATISFIED
- ✓ Migration in `migrations/001_create_contacts_table.sql`
- ✓ Schema:
  ```sql
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
  ```

**How to Verify:**
```powershell
psql "postgresql://identify_user:8978@localhost:5432/identify_db" -c "\d contacts"
```

---

## 🧪 How to Run Full Test Suite

### Prerequisites:
1. Ensure PostgreSQL is running with the identify database
2. Ensure migration has been applied
3. Ensure dev server is running: `npm run dev`

### Run Tests:
```powershell
cd D:\projects\identify-service

# Run the comprehensive test script
.\test-identify.ps1

# Then query DB to verify state
psql "postgresql://identify_user:8978@localhost:5432/identify_db" -c "SELECT id, email, phone_number, linked_id, link_precedence, created_at FROM contacts ORDER BY id;"
```

---

## Summary

| Requirement | Status | Evidence |
|---|---|---|
| POST /identify endpoint | ✅ | `src/routes/identifyRoutes.ts` |
| Optional email & phone | ✅ | `src/types.ts` IdentifyRequest |
| Correct response format | ✅ | `src/types.ts` IdentifyResponse |
| Create primary when none exist | ✅ | `src/controllers/identifyController.ts` line consolidateContacts |
| Create secondary for new info | ✅ | `src/controllers/identifyController.ts` |
| Primary to secondary downgrade | ✅ | `src/controllers/identifyController.ts` consolidateContacts |
| Null email handling | ✅ | `src/controllers/identifyController.ts` |
| Null phone handling | ✅ | `src/controllers/identifyController.ts` |
| Unique arrays | ✅ | `src/controllers/identifyController.ts` buildResponse |
| Primary data first | ✅ | `src/controllers/identifyController.ts` buildResponse |
| Correct DB schema | ✅ | `migrations/001_create_contacts_table.sql` |

**Overall Status: ✅ ALL REQUIREMENTS SATISFIED**
