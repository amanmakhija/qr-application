export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
  createdAt: string;
  updatedAt: string;
}
