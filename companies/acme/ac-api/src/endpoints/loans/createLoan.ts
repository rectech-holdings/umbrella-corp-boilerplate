import { db } from "../../utils/db.js";

export async function createLoan(p: { loanTitle: string; ownerEmail: string }) {
  const res = await db.loan.create({
    data: { title: p.loanTitle, author: { create: { email: p.ownerEmail } } },
  });

  console.log("here");
  return res;
}
