import { db } from "../../utils/db.js";

export async function getLoan(loanId: number) {
  const res = await db.loan.findUnique({
    where: { id: loanId },
  });

  return res;
}
