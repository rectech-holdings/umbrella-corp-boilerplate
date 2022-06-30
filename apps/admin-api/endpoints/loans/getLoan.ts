export async function getLoan(p: { loanId: string }) {
  console.log("Getting loan...");

  return {
    coolLoan: p,
  };
}
