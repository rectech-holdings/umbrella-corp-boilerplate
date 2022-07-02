import { db } from "../../utils/db";

export async function getPerson(personId: string) {
  const posts = await db.$queryRaw`select 1`;

  console.log("Getting person.");
  return posts;
}
