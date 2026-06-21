# Firebase Push Notifications Setup for Apple (APNs)

This guide explains how to connect your Apple Developer Account to Firebase so you can send Push Notifications to iOS/Safari users via Firebase Cloud Messaging (FCM).

We will use the **Auth Key (.p8 file)** that you generated in the `APPLE.md` guide.

---

## 1. Prerequisites
- You must have followed the `APPLE.md` guide.
- You must have your `.p8` Auth Key file downloaded to your computer.
- You must know your **Key ID** (10 characters).
- You must know your **Team ID** (10 characters).
- You must know your **Primary App ID** (Bundle ID, e.g., `com.yourdomain.darkgammon`).

---

## 2. Configuring Firebase Cloud Messaging
Instead of uploading clunky `.cer` certificates for Development and Production separately, Firebase allows you to upload the single `.p8` Auth Key, which works for both Development and Production environments seamlessly.

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your project (`tavla-be`).
3. Click the **Gear Icon (⚙️)** next to "Project Overview" in the left sidebar and select **Project settings**.
4. Navigate to the **Cloud Messaging** tab at the top.

### Uploading the APNs Auth Key
1. Scroll down to the **Apple app configuration** section. 
   *(Note: If you haven't added an iOS App to your Firebase project yet, you must add one first by clicking the iOS icon in the General tab and entering your Bundle ID: `com.yourdomain.darkgammon`)*.
2. Under your iOS app configuration, look for the **APNs Authentication Key** section (Do NOT use the "APNs Certificates" section).
3. Click the **Upload** button.
4. A modal will appear asking for three things:
   - **APNs Auth Key (.p8 file):** Browse and select the `.p8` file you downloaded from the Apple Developer Portal.
   - **Key ID:** Enter the 10-character Key ID associated with your `.p8` file.
   - **Team ID:** Enter your 10-character Apple Team ID.
5. Click **Upload**.

---

## 3. Web Push Configuration (VAPID Key)
Since you are building a web-based game, you also need to generate a VAPID key for Web Push notifications (Safari, Chrome, Firefox).

1. Still in the **Cloud Messaging** tab, scroll down to the **Web configuration** section.
2. Under **Web Push certificates**, click **Generate key pair**.
3. A new Key Pair will be generated. You will use this public key in your frontend code when requesting notification permissions from the user.

---

## 4. Environment Variables Checklist
Make sure your `.env.local` file contains your Firebase Admin SDK credentials and your public Firebase config. 

Your server uses `FIREBASE_SERVICE_ACCOUNT_KEY` to securely talk to Firebase Admin and trigger the notifications, and Firebase Admin securely talks to Apple using the `.p8` key you just uploaded to the console.

You are now fully configured to send Push Notifications!
