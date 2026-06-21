# Apple Developer Setup Guide

This guide explains how to generate the necessary keys and identifiers required for **Apple Sign-In** and **Push Notifications** (APNs) from scratch.

> [!IMPORTANT]
> **Never commit your private keys (e.g., `.p8`, `.key`) to Git.**
> Always use environment variables (`.env` or `.env.local`) to store them.

## 1. Prerequisites
You need an active [Apple Developer Program](https://developer.apple.com/programs/) membership.

---

## 2. Setting up the App ID
First, you need an App ID that acts as the primary identifier for your application.

1. Go to the [Apple Developer Portal](https://developer.apple.com/account).
2. Navigate to **Certificates, IDs & Profiles** -> **Identifiers**.
3. Click the **+** button to create a new identifier.
4. Select **App IDs** and click **Continue**.
5. Select type **App** and click **Continue**.
6. Fill in the **Description** (e.g., `Darkgammon Web App`) and provide an explicit **Bundle ID** (e.g., `com.yourdomain.darkgammon`).
7. Scroll down to the **Capabilities** section and check:
   - **Sign In with Apple**
   - **Push Notifications**
8. Click **Continue**, then **Register**.

---

## 3. Setting up the Services ID (For Web Authentication)
If you are implementing Apple Sign-In for a website, you need a Services ID.

1. Go back to **Identifiers**, click the **+** button.
2. Select **Services IDs** and click **Continue**.
3. Fill in the **Description** and provide an **Identifier** (e.g., `com.yourdomain.darkgammon.web`). 
   > **Note:** This identifier is your `APPLE_CLIENT_ID`.
4. Click **Continue** and **Register**.
5. Click on your newly created Services ID to configure it.
6. Check **Sign In with Apple**, then click **Configure**.
7. Select your Primary App ID (the one you created in Step 2).
8. Add your **Web Domain** (e.g., `tavla.be` or `localhost`).
9. Add your **Return URLs** (e.g., `https://tavla.be/api/auth/callback/apple`).
10. Click **Next**, **Done**, **Continue**, and **Save**.

---

## 4. Generating the Auth Key (.p8)
Instead of dealing with certificates and CSRs, modern Apple services (both Sign-In and Push Notifications) use a single **Auth Key (.p8 file)**. This is vastly simpler and more secure.

1. Go to **Certificates, IDs & Profiles** -> **Keys**.
2. Click the **+** button to create a new key.
3. Enter a **Key Name** (e.g., `Darkgammon Auth Key`).
4. Enable the checkboxes for:
   - **Apple Push Notifications service (APNs)**
   - **Sign in with Apple**
5. Click **Configure** next to *Sign in with Apple* and associate it with your Primary App ID.
6. Click **Continue**, then **Register**.
7. **DOWNLOAD THE KEY (.p8 file):** 
   > [!WARNING]
   > You can only download this file **ONCE**. Keep it safe and **DO NOT** commit it to your repository.
8. Note down the **Key ID** (a 10-character string).

---

## 5. Required Environment Variables
Now you have everything you need to populate your `.env` file. Open your downloaded `.p8` file in a text editor to view the private key.

In your `.env.local` or production environment, add the following variables:

```env
# Your 10-character Apple Team ID (found in the top right of the Developer Portal)
APPLE_TEAM_ID="XXXXXXXXXX"

# The Services ID you created in Step 3 (e.g., com.yourdomain.darkgammon.web)
APPLE_CLIENT_ID="com.yourdomain.darkgammon.web"

# The 10-character Key ID from Step 4
APPLE_KEY_ID="XXXXXXXXXX"

# The raw contents of the .p8 file (ensure newlines are properly handled if required by your framework)
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGTAgEA...[REST OF KEY]...\n-----END PRIVATE KEY-----"
```

## 6. Cleanup (For Existing Exposed Keys)
If you had any old `.key`, `.cer`, or `.p8` files that were accidentally exposed or are no longer used:
1. Revoke them from the Apple Developer Portal (under Certificates or Keys).
2. Delete the physical files from your repository.
3. Use environment variables strictly as outlined above.
