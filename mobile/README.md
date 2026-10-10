# SchoolOS Android app

A small Android app (`android/`) that opens SchoolOS running on a laptop on
the same Wi-Fi. No hosting needed. It adds what a browser tab would otherwise
do: picking files to upload, saving report cards and attendance sheets to
Downloads, the back button, and a "can't reach SchoolOS" screen where the
server address can be changed on the phone.

## Run SchoolOS for phones (on the laptop)

1. Backend: `cd backend && npm start`
2. Website, in forwarding mode so phones can reach it. Create
   `frontend/.env.production.local` (already done on this laptop):

   ```
   NEXT_PUBLIC_API_URL=/api
   API_PROXY_TARGET=http://localhost:5000
   ```

   then `cd frontend && npm run build && npm run start:lan`
3. The laptop's Wi-Fi address (`ipconfig`, e.g. `192.168.10.97`) plus `:3000`
   is the server address. The laptop itself can keep using
   http://localhost:3000.

## Build and install the APK

Set the default server address in `android/gradle.properties`
(`schoolos.serverUrl`), then with the phone plugged in (USB debugging on):

```powershell
cd mobile/android
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-20'
.\gradlew.bat assembleRelease
adb install -r app\build\outputs\apk\release\app-release.apk
```

The APK is `android/app/build/outputs/apk/release/app-release.apk` and can
also be copied to other phones and installed by hand ("install unknown
apps" must be allowed). It is signed with the local debug key, which is fine
for the school's own phones but not for the Play Store.

If the laptop's IP changes, open the app, wait for "Can't reach SchoolOS",
tap **Change server address** and enter the new one. No new APK needed.
