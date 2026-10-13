# SchoolOS Android app

A small Android app (`android/`) that opens your hosted SchoolOS website.
Works from anywhere with an internet connection — no same-WiFi or laptop
required. It adds what a browser tab would otherwise handle: picking files to
upload, saving report cards and attendance sheets to Downloads, the back
button, and automatic dark/light status bar matching.

## First launch

When the app is opened for the first time, it asks the user to enter the
SchoolOS URL (e.g. `https://your-school.vercel.app`). The address is saved
on the phone and can be changed later from the offline screen.

## Build and install the APK

Optionally set a default server address in `android/gradle.properties`
(`schoolos.serverUrl`). If left empty, the app will prompt for it on
first launch. Then with the phone plugged in (USB debugging on):

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

## Changing the server address

If the URL changes, open the app, wait for the "Can't reach SchoolOS"
screen, tap **Change server address** and enter the new one. No new APK
needed.

## Supported setups

| Setup | URL example |
|---|---|
| Vercel + Render (hosted) | `https://your-school.vercel.app` |
| Custom domain | `https://www.school.edu.bd` |
| Laptop on same Wi-Fi (testing) | `http://192.168.10.97:3000` |
