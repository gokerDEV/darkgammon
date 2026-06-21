const admin = require("firebase-admin");
require("dotenv").config({ path: ".env.local" });

async function run() {
  let credential;
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      );
      credential = admin.credential.cert(serviceAccount);
    } else {
      console.log("No FIREBASE_SERVICE_ACCOUNT_KEY");
      return;
    }
  } catch (e) {
    console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY", e);
    return;
  }

  admin.initializeApp({
    credential: credential || admin.credential.applicationDefault(),
  });

  const tokens = [
    "f5DG0G2KzxUo-R8-t_Q0OI:APA91bFvfFpUSHgmQ5ThJzy2yqysXeFHY_dXGUJAJbnbGkoKUqGjOw5hkjbe-Kmww2BEyhbb7wWMqNbrVqKos1oUh3LxYz62P3zoLdoZcLO1Tar8G6I6Ht4",
  ];
  try {
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: {
        title: "Test Notification",
        body: "This is a test from backend",
      },
      data: {
        challengeId: "123",
      },
    });
    console.log("Success count:", response.successCount);
    console.log("Failure count:", response.failureCount);
    if (response.responses[0].error) {
      console.error("Error details:", response.responses[0].error);
    }
  } catch (err) {
    console.error("Multicast error", err);
  }
}
run();
