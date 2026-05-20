export interface Contact {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  organization: string;
  website: string;
  address: string;
  avatar: string; // Base64 DataURL
  linkedin?: string;
  twitter?: string;
  github?: string;
  instagram?: string;
  createdAt?: string;
}

export interface DbStatus {
  configured: boolean;
  mode: "database" | "memory";
  connected: boolean;
  dbName: string;
  error: string | null;
}
