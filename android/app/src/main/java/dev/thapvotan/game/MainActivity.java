package dev.thapvotan.game;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.view.View;
import android.view.HapticFeedbackConstants;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private WebView web;
    private DevicePowerMonitor devicePower;
    private String pendingExport;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().setStatusBarColor(Color.rgb(11,19,28));
        getWindow().setNavigationBarColor(Color.rgb(11,19,28));
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(11,19,28));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return WindowInsets.CONSUMED;
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets.consumeSystemWindowInsets();
        });
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(11,19,28));
        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMediaPlaybackRequiresUserGesture(true);
        web.addJavascriptInterface(new SaveBridge(), "AndroidSave");
        devicePower = new DevicePowerMonitor(this, () -> runOnUiThread(() -> {
            if (web != null && !isDestroyed()) web.evaluateJavascript("window.dispatchEvent(new Event('devicepowerchange'))", null);
        }));
        web.addJavascriptInterface(devicePower, "AndroidDevice");
        if (BuildConfig.DEBUG) WebView.setWebContentsDebuggingEnabled(true);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!HOST.equals(uri.getHost())) return empty();
                String file = uri.getPath();
                if (file == null || file.equals("/")) file = "/index.html";
                if (file.contains("..") || file.contains("\\")) return empty();
                String mime = file.endsWith(".mjs") ? "text/javascript" : file.endsWith(".css") ? "text/css" : file.endsWith(".svg") ? "image/svg+xml" : file.endsWith(".woff2") ? "font/woff2" : file.endsWith(".ttf") ? "font/ttf" : "text/html";
                try { return new WebResourceResponse(mime, "UTF-8", getAssets().open(file.substring(1))); }
                catch (Exception ex) { return empty(); }
            }
        });
        root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        web.loadUrl("https://" + HOST + "/index.html");
    }
    private WebResourceResponse empty() { return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",java.util.Collections.emptyMap(),new ByteArrayInputStream(new byte[0])); }
    private final class SaveBridge {
        @JavascriptInterface public void haptic(boolean strong) {
            runOnUiThread(() -> {
                if (web != null && web.hasWindowFocus()) web.performHapticFeedback(strong ? HapticFeedbackConstants.LONG_PRESS : HapticFeedbackConstants.KEYBOARD_TAP);
            });
        }
        @JavascriptInterface public void exportSave(String json) {
            if (json.length() > 2000000) return;
            runOnUiThread(() -> {
                pendingExport = json;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                intent.putExtra(Intent.EXTRA_TITLE,"thap-vo-tan-save.json");
                startActivityForResult(intent,101);
            });
        }
        @JavascriptInterface public void importSave() {
            runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("application/json");
                startActivityForResult(intent,102);
            });
        }
    }
    @Override protected void onActivityResult(int code,int result,Intent data) {
        super.onActivityResult(code,result,data);
        if (result != RESULT_OK || data == null || data.getData() == null) { pendingExport=null; return; }
        try {
            if (code==101 && pendingExport!=null) {
                try (OutputStream out=getContentResolver().openOutputStream(data.getData())) { out.write(pendingExport.getBytes(StandardCharsets.UTF_8)); }
                pendingExport=null;
                web.evaluateJavascript("window.nativeNotice('Đã xuất bản lưu thành công.')",null);
            } else if (code==102) {
                String json;
                try (InputStream in=getContentResolver().openInputStream(data.getData()); ByteArrayOutputStream out=new ByteArrayOutputStream()) {
                    byte[] buffer=new byte[4096]; int size;
                    while ((size=in.read(buffer))!=-1) { if(out.size()+size>6000000) throw new IllegalArgumentException("Save too large"); out.write(buffer,0,size); }
                    json=out.toString("UTF-8");
                    if (json.length() > 2000000) throw new IllegalArgumentException("Save too large");
                }
                web.evaluateJavascript("window.receiveNativeSave("+JSONObject.quote(json)+")",null);
            }
        } catch (Exception ex) { web.evaluateJavascript("window.nativeNotice('Không thể đọc hoặc ghi bản lưu.')",null); }
    }
    @Override public void onBackPressed() {
        web.evaluateJavascript("window.gameBack ? window.gameBack() : false", value -> {
            if (!"true".equals(value)) new AlertDialog.Builder(this).setTitle("Tạm biệt, lữ khách?").setMessage("Tiến trình đã được lưu. Bạn có thể tiếp tục bất cứ lúc nào.").setPositiveButton("Thoát",(dialog,which)->finish()).setNegativeButton("Chơi tiếp",null).show();
        });
    }
    @Override protected void onPause() { if(devicePower!=null)devicePower.stop();web.evaluateJavascript("window.dispatchEvent(new Event('pagehide'))",null); web.onPause();super.onPause(); }
    @Override protected void onResume() { super.onResume(); if(web!=null){web.onResume();if(devicePower!=null)devicePower.start();web.evaluateJavascript("window.dispatchEvent(new Event('pageshow'))",null);} }
    @Override protected void onDestroy() { if(devicePower!=null)devicePower.stop();if(web!=null){web.removeJavascriptInterface("AndroidDevice");web.removeJavascriptInterface("AndroidSave");web.destroy();web=null;}super.onDestroy(); }
}
