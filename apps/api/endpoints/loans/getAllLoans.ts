import { db } from "../../utils/db";

export async function getAllLoans(p: {}) {
  const loans = await db.loan.findMany();

  return loans;
}
