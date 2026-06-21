import clientPromise from "../src/lib/db/mongodb";

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);

  const users = await db.collection("users").find().toArray();
  console.log("USERS:", JSON.stringify(users, null, 2));

  const accounts = await db.collection("accounts").find().toArray();
  console.log("ACCOUNTS:", JSON.stringify(accounts, null, 2));

  const profiles = await db.collection("profiles").find().toArray();
  console.log("PROFILES:", JSON.stringify(profiles, null, 2));

  process.exit(0);
}
main().catch(console.error);
