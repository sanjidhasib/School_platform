package bd.edu.bzs.schoolos;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.URLUtil;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * SchoolOS as a phone app: a full-screen WebView on the hosted SchoolOS website.
 * Works from anywhere with internet — no same-WiFi requirement. Also supports
 * local laptop addresses for development/testing.
 *
 * On first launch (no URL configured), shows a setup screen where the user
 * enters their school's SchoolOS address. After that, the app loads the site
 * directly. If the server can't be reached, an offline screen appears with
 * options to retry or change the address.
 *
 * Adds what a browser tab would otherwise handle: picking files to upload,
 * saving downloads, the back button, and a screen for when the server
 * can't be reached.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "schoolos";
    private static final String KEY_SERVER = "serverUrl";
    private static final String SETUP_PAGE = "file:///android_asset/offline.html";
    private static final int FILE_CHOOSER = 1;

    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    /**
     * Report cards and attendance sheets are made in the page as blob: links
     * and revoked straight after the click, which a WebView can't download.
     * This keeps each blob as it's created and hands clicked ones to Java.
     */
    private static final String PAGE_HOOK =
        "(function(){if(window.__schoolosHook)return;window.__schoolosHook=1;"
      + "var blobs={},make=URL.createObjectURL;"
      + "URL.createObjectURL=function(o){var u=make.call(URL,o);if(o instanceof Blob)blobs[u]=o;return u;};"
      + "var click=HTMLAnchorElement.prototype.click;"
      + "HTMLAnchorElement.prototype.click=function(){var b=blobs[this.href];"
      + "if(b){var name=this.getAttribute('download')||'download',r=new FileReader();"
      + "r.onload=function(){Android.saveFile(name,b.type||'application/octet-stream',String(r.result).split(',')[1]);};"
      + "r.readAsDataURL(b);return;}return click.call(this);};"
      // The site can be switched light/dark on its own; tell the app so the
      // phone's status bar matches.
      + "var h=document.documentElement,last=null,tell=function(){var d=h.classList.contains('dark');"
      + "if(d!==last){last=d;Android.setDark(d);}};"
      + "new MutationObserver(tell).observe(h,{attributes:true,attributeFilter:['class']});tell();})();";

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        // Draw the page just outside the screen ahead of time, so scrolling
        // doesn't show blank areas or stutter while content is painted.
        s.setOffscreenPreRaster(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " SchoolOSApp/" + BuildConfig.VERSION_NAME);

        // Allow mixed content so HTTPS pages can load local HTTP resources
        // (useful during testing, and for sites that reference HTTP images)
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new Client());
        web.setWebChromeClient(new Chrome());
        web.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) ->
            downloadUrl(url, userAgent, contentDisposition, mimeType));

        if (savedInstanceState != null) {
            web.restoreState(savedInstanceState);
        } else {
            String url = serverUrl();
            if (url.isEmpty()) {
                // First launch: no URL configured — show setup screen
                web.loadUrl(SETUP_PAGE);
            } else {
                web.loadUrl(url);
            }
        }
    }

    /** Returns the saved server URL, or the build-time default, or empty string. */
    private String serverUrl() {
        String saved = getSharedPreferences(PREFS, MODE_PRIVATE).getString(KEY_SERVER, null);
        if (saved != null && !saved.isEmpty()) return saved;
        // BuildConfig.SERVER_URL may be empty if not set in gradle.properties
        String built = BuildConfig.SERVER_URL;
        return built != null ? built : "";
    }

    /** Returns the host part of the server URL, or null if not configured. */
    private String serverHost() {
        String url = serverUrl();
        if (url.isEmpty()) return null;
        return Uri.parse(url).getHost();
    }

    /** Returns true if no server URL has been configured yet. */
    private boolean needsSetup() {
        return serverUrl().isEmpty();
    }

    // ---------------------------------------------------------------- browsing

    private class Client extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            String scheme = uri.getScheme();
            String host = serverHost();
            // The school site stays in the app; anything else (maps, mail,
            // phone numbers, other websites) opens in the right phone app.
            if (host != null
                && ("http".equals(scheme) || "https".equals(scheme))
                && uri.getHost() != null && uri.getHost().equals(host)) {
                return false;
            }
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (ActivityNotFoundException e) {
                Toast.makeText(MainActivity.this, "No app can open this link", Toast.LENGTH_SHORT).show();
            }
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            if (url != null && !url.startsWith("file:")) view.evaluateJavascript(PAGE_HOOK, null);
            CookieManager.getInstance().flush();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            // Only the page itself failing means "can't reach the server";
            // a missing picture shouldn't replace the whole screen.
            if (request.isForMainFrame()) view.loadUrl(SETUP_PAGE);
        }
    }

    // ---------------------------------------------------------------- uploads

    private class Chrome extends WebChromeClient {
        @Override
        public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
            if (fileCallback != null) fileCallback.onReceiveValue(null);
            fileCallback = callback;
            try {
                startActivityForResult(params.createIntent(), FILE_CHOOSER);
            } catch (ActivityNotFoundException e) {
                fileCallback = null;
                Toast.makeText(MainActivity.this, "No app to pick files", Toast.LENGTH_SHORT).show();
                return false;
            }
            return true;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    // ---------------------------------------------------------------- downloads

    /** Ordinary links to files (textbook PDFs): the phone's download manager, signed in. */
    private void downloadUrl(String url, String userAgent, String contentDisposition, String mimeType) {
        if (url.startsWith("blob:")) return; // handled by PAGE_HOOK
        try {
            String name = URLUtil.guessFileName(url, contentDisposition, mimeType);
            DownloadManager.Request req = new DownloadManager.Request(Uri.parse(url));
            req.addRequestHeader("Cookie", CookieManager.getInstance().getCookie(url));
            req.addRequestHeader("User-Agent", userAgent);
            req.setMimeType(mimeType);
            req.setTitle(name);
            req.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, name);
            ((DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE)).enqueue(req);
            Toast.makeText(this, "Downloading " + name, Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Could not download the file", Toast.LENGTH_SHORT).show();
        }
    }

    /** Saves a file made in the page into Downloads. */
    private void saveToDownloads(String name, String mimeType, byte[] bytes) throws Exception {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues v = new ContentValues();
            v.put(MediaStore.Downloads.DISPLAY_NAME, name);
            v.put(MediaStore.Downloads.MIME_TYPE, mimeType);
            v.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (uri == null) throw new IllegalStateException("no Downloads folder");
            try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                out.write(bytes);
            }
            v.clear();
            v.put(MediaStore.Downloads.IS_PENDING, 0);
            getContentResolver().update(uri, v, null, null);
        } else {
            // Android 8/9: the app's own Downloads folder needs no permission prompt.
            File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
            try (FileOutputStream out = new FileOutputStream(new File(dir, name))) {
                out.write(bytes);
            }
        }
    }

    // ---------------------------------------------------------------- page ↔ app

    private class Bridge {
        @JavascriptInterface
        public void saveFile(String name, String mimeType, String base64) {
            String safe = name.replaceAll("[\\\\/:*?\"<>|]", "_");
            try {
                saveToDownloads(safe, mimeType, Base64.decode(base64, Base64.DEFAULT));
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                    "Saved to Downloads: " + safe, Toast.LENGTH_LONG).show());
            } catch (Exception e) {
                runOnUiThread(() -> Toast.makeText(MainActivity.this,
                    "Could not save " + safe, Toast.LENGTH_LONG).show());
            }
        }

        @JavascriptInterface
        public void setDark(boolean dark) {
            runOnUiThread(() -> {
                getWindow().setStatusBarColor(dark ? 0xFF1A1F38 : 0xFF104028);
                getWindow().setNavigationBarColor(dark ? 0xFF12162B : 0xFF104028);
            });
        }

        @JavascriptInterface
        public String getServerUrl() {
            return serverUrl();
        }

        /**
         * Returns the mode for the offline/setup page:
         * - "setup" if no URL has been configured (first launch)
         * - "offline" if a URL is configured but the server can't be reached
         */
        @JavascriptInterface
        public String getAppMode() {
            return needsSetup() ? "setup" : "offline";
        }

        @JavascriptInterface
        public void setServerUrl(String url) {
            String clean = url == null ? "" : url.trim();
            if (!clean.startsWith("http://") && !clean.startsWith("https://")) clean = "https://" + clean;
            while (clean.endsWith("/")) clean = clean.substring(0, clean.length() - 1);
            SharedPreferences.Editor e = getSharedPreferences(PREFS, MODE_PRIVATE).edit();
            e.putString(KEY_SERVER, clean).apply();
            String target = clean;
            runOnUiThread(() -> web.loadUrl(target));
        }

        @JavascriptInterface
        public void retry() {
            runOnUiThread(() -> {
                String url = serverUrl();
                if (url.isEmpty()) {
                    web.loadUrl(SETUP_PAGE);
                } else {
                    web.loadUrl(url);
                }
            });
        }
    }

    // ---------------------------------------------------------------- lifecycle

    @Override
    public void onBackPressed() {
        if (web.canGoBack() && !SETUP_PAGE.equals(web.getUrl())) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    protected void onPause() {
        super.onPause();
        CookieManager.getInstance().flush();
        web.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
