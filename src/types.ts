export interface Contact {
  id?: number;
  email: string | null;
  phoneNumber: string | null;
  linkedId: number | null;
  linkPrecedence: "primary" | "secondary";
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}
