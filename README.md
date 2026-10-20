# Bakery Oven Guide — shared camera photos

This is a web app (not a PowerPoint). It contains the 25 product records from the provided PPT. It uses Firebase Authentication, Cloud Firestore and Cloud Storage for live shared photo updates.

## Setup
1. Create a Firebase project at https://console.firebase.google.com/ . Note that Cloud Storage may require a billing-enabled Firebase project; review pricing before enabling it.
2. Register a **web app**, copy its `firebaseConfig` values into `firebase-config.js`.
3. Enable Authentication → Sign-in method → Anonymous. For a real bakery, replace anonymous access with staff-only sign-in before deployment. Anonymous access with the rules below permits any visitor to replace pictures.
4. Enable Cloud Firestore and Cloud Storage. Apply the sample rules in `firestore.rules` and `storage.rules` **only for initial testing**; these are NOT safe for a public site.
5. Host this folder using HTTPS (e.g. Firebase Hosting). Add the deployed domain to Firebase Authentication authorized domains if needed.
6. Open the URL on a phone, tap a product, and tap the camera button. Depending on browser/phone, this opens the camera or a camera/gallery picker. On save, connected users see the new photo in real time.

## Security and production
Before sharing the site broadly, require named staff sign-in, limit uploads to approved editors, and use restrictive Firebase security rules. The sample rules are deliberately temporary. Avoid distributing the app publicly with anonymous write access. Replace them before production.

## Notes
- The app uses original product names, temperatures, times and notes from the supplied PPT; uncertain source values remain flagged.
- Photos are empty until staff uploads them.
- Requires network access; not a fully offline app.
- On mobile, camera availability depends on the browser and operating system.
- `app.js` imports JSON modules; use a modern browser and serve via HTTPS/web server, not `file://`.
