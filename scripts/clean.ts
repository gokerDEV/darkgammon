import clientPromise from "../src/lib/db/mongodb";

async function main() {
  const client = await clientPromise;
  const db = client.db(process.env.DB_NAME);
  await db.collection("profiles").deleteOne({ handle: "lokum" });
  console.log("Deleted lokum profile");
  process.exit(0);
}
main();
