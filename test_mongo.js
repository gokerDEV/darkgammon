const { MongoClient } = require("mongodb");
async function run() {
  const client = new MongoClient("mongodb://localhost:27017");
  await client.connect();
  const db = client.db("tavlabe");
  const profiles = await db
    .collection("profiles")
    .find({ fcmTokens: { $exists: true, $not: { $size: 0 } } })
    .toArray();
  console.log(
    "Profiles with tokens:",
    profiles.map((p) => ({ handle: p.handle, tokens: p.fcmTokens })),
  );
  await client.close();
}
run();
