# API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### 1. Health Check

**Endpoint:** `GET /health`

Check service availability and status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "identify-service"
}
```

---

### 2. Identify & Consolidate Contacts

**Endpoint:** `POST /identify`

Consolidate customer contact information based on email and phone number matching.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "email@example.com",
  "phoneNumber": "1234567890"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | No* | Customer email address (valid email format required) |
| phoneNumber | string | No* | Customer phone number (min 7 digits) |

*At least one of `email` or `phoneNumber` must be provided.

**Response (200 OK):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["email@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| primaryContatctId | number | ID of the primary contact (oldest) |
| emails | array | All unique emails linked to this contact |
| phoneNumbers | array | All unique phone numbers linked to this contact |
| secondaryContactIds | array | IDs of secondary contacts linked to primary |

**Error Responses:**

**400 Bad Request - Missing required fields:**
```json
{
  "error": "At least one of email or phoneNumber must be provided"
}
```

**400 Bad Request - Invalid email:**
```json
{
  "error": "Invalid email format"
}
```

**400 Bad Request - Invalid phone:**
```json
{
  "error": "Invalid phone number format"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error"
}
```

---

## Examples

### Example 1: Create New Contact
**Request:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "phoneNumber": "1234567890"
  }'
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["john@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": []
  }
}
```

### Example 2: Link Existing Contact with New Email
**Request:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@example.com",
    "phoneNumber": "1234567890"
  }'
```

**Response (when phone 1234567890 already exists):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["john@example.com", "newemail@example.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2]
  }
}
```

### Example 3: Merge Multiple Contacts
**Request:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com"
  }'
```

**Response (when email is linked to existing phone with different contact):**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["john@example.com", "other@example.com"],
    "phoneNumbers": ["1234567890", "9876543210"],
    "secondaryContactIds": [2]
  }
}
```

### Example 4: Email Only Query
**Request:**
```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

---

## Consolidation Rules

The identify endpoint follows these consolidation rules:

1. **If no match is found:** Create a new primary contact with provided information
2. **If match(es) found:**
   - The oldest contact (by `created_at`) becomes the primary
   - All other contacts with `link_precedence = 'primary'` are downgraded to secondary
   - A secondary contact is created if new email or phone is provided
3. **Primary contact priority:** Primary contact's email/phone appear first in response arrays
4. **Unique values:** Response includes only unique emails and phone numbers across all linked contacts

---

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input or missing required fields |
| 404 | Not Found | Endpoint does not exist |
| 500 | Server Error | Internal server error |

---

## Database Schema

Contacts are stored with the following structure:

```sql
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255),
  phone_number VARCHAR(255),
  linked_id INT REFERENCES contacts(id),
  link_precedence VARCHAR(20) CHECK (link_precedence IN ('primary', 'secondary')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

**Fields:**
- `id` - Unique contact identifier
- `email` - Contact email (nullable)
- `phone_number` - Contact phone number (nullable)
- `linked_id` - ID of primary contact if this is secondary
- `link_precedence` - Either 'primary' or 'secondary'
- `created_at` - Contact creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft deletion timestamp (for data recovery)
