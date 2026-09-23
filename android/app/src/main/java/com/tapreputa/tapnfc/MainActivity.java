package com.tapreputa.tapnfc;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.nfc.NdefMessage;
import android.nfc.NdefRecord;
import android.nfc.NfcAdapter;
import android.nfc.Tag;
import android.nfc.tech.Ndef;
import android.nfc.tech.NdefFormatable;
import android.os.Bundle;
import android.os.Message;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import org.json.JSONObject;

import java.io.IOException;
import java.util.Locale;

public class MainActivity extends Activity implements NfcAdapter.ReaderCallback {

    private static final String HOME_URL = "https://tapreputa.github.io/Scheda-nuovo-Cliente/";
    private static final int FILE_CHOOSER_REQUEST = 1001;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private NfcAdapter nfcAdapter;
    private final Object nfcWriteLock = new Object();
    private volatile boolean nfcWriteActive = false;
    private volatile String pendingNfcUrl = null;
    private volatile boolean pendingNfcErase = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(5, 12, 25));
        getWindow().setNavigationBarColor(Color.rgb(7, 21, 43));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(248, 249, 252));
        setContentView(webView);
        nfcAdapter = NfcAdapter.getDefaultAdapter(this);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportMultipleWindows(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        webView.addJavascriptInterface(new AndroidBridge(), "TapAndroid");

        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        webView.clearCache(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleNavigation(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return handleNavigation(Uri.parse(url));
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView,
                                             ValueCallback<Uri[]> newFilePathCallback,
                                             FileChooserParams fileChooserParams) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }
                filePathCallback = newFilePathCallback;

                Intent intent;
                try {
                    intent = fileChooserParams.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "Nessuna app disponibile per scegliere il file.", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }

            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView popup = new WebView(MainActivity.this);
                popup.getSettings().setJavaScriptEnabled(true);
                popup.getSettings().setDomStorageEnabled(true);
                popup.getSettings().setCacheMode(WebSettings.LOAD_NO_CACHE);

                popup.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        return handlePopupNavigation(request.getUrl());
                    }

                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, String url) {
                        return handlePopupNavigation(Uri.parse(url));
                    }
                });

                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
        });

        if (savedInstanceState == null) {
            webView.loadUrl(HOME_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void notifyExcelSaveResult(boolean success) {
        final String script;
        if (success) {
            script = "(function(){try{var d=new Date();localStorage.setItem('tapreputa_last_excel_export_v1',d.toISOString());var e=document.getElementById('lastExportStamp');if(e)e.textContent='Ultima esportazione: '+d.toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'});}catch(_){}})();";
        } else {
            script = "(function(){try{localStorage.removeItem('tapreputa_last_excel_export_v1');var e=document.getElementById('lastExportStamp');if(e)e.textContent='Esportazione non riuscita';var b=document.getElementById('exportExcelBtn');if(b){b.disabled=false;b.innerHTML='<span class=\"tap-export-icon\">⇩</span><span>Esporta</span>';}}catch(_){}})();";
        }
        webView.evaluateJavascript(script, null);
    }

    private class AndroidBridge {
        @JavascriptInterface
        public void saveBase64File(String base64, String fileName, String mimeType) {
            runOnUiThread(() -> {
                try {
                    byte[] data = Base64.decode(base64, Base64.DEFAULT);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Tapreputa");
                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri == null) throw new IllegalStateException("Impossibile creare il file");
                        try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                            if (out == null) throw new IllegalStateException("Impossibile aprire il file");
                            out.write(data);
                            out.flush();
                        }
                        notifyExcelSaveResult(true);
                        Toast.makeText(MainActivity.this, "Excel salvato in Download/Tapreputa", Toast.LENGTH_LONG).show();
                    } else {
                        File base = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                        if (base == null) throw new IllegalStateException("Cartella Download non disponibile");
                        File dir = new File(base, "Tapreputa");
                        if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Impossibile creare la cartella");
                        File file = new File(dir, fileName);
                        try (OutputStream out = new FileOutputStream(file)) {
                            out.write(data);
                            out.flush();
                        }
                        notifyExcelSaveResult(true);
                        Toast.makeText(MainActivity.this, "Excel salvato: " + file.getAbsolutePath(), Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e) {
                    notifyExcelSaveResult(false);
                    Toast.makeText(MainActivity.this, "Esportazione Excel non riuscita.", Toast.LENGTH_LONG).show();
                }
            });
        }

        @JavascriptInterface
        public void writeNfcUrl(String url, String label) {
            runOnUiThread(() -> startNfcWrite(url));
        }

        @JavascriptInterface
        public void eraseNfcTag() {
            runOnUiThread(() -> startNfcErase());
        }

        @JavascriptInterface
        public void cancelNfcWrite() {
            runOnUiThread(() -> cancelNfcWriteInternal());
        }
    }

    private void startNfcWrite(String rawUrl) {
        String url = rawUrl == null ? "" : rawUrl.trim();
        if (!isAllowedNfcUrl(url)) {
            notifyNfcWriteResult(false, "Il link selezionato non è valido per la scrittura NFC.");
            return;
        }
        if (nfcAdapter == null) {
            notifyNfcWriteResult(false, "Questo telefono non dispone della funzione NFC.");
            return;
        }
        if (!nfcAdapter.isEnabled()) {
            notifyNfcWriteResult(false, "NFC disattivato. Attivalo dalle impostazioni rapide e premi Riprova.");
            return;
        }

        synchronized (nfcWriteLock) {
            pendingNfcUrl = url;
            pendingNfcErase = false;
            nfcWriteActive = true;
        }

        int flags = NfcAdapter.FLAG_READER_NFC_A
                | NfcAdapter.FLAG_READER_NFC_B
                | NfcAdapter.FLAG_READER_NFC_F
                | NfcAdapter.FLAG_READER_NFC_V;
        try {
            nfcAdapter.enableReaderMode(this, this, flags, null);
        } catch (Exception error) {
            synchronized (nfcWriteLock) {
                pendingNfcUrl = null;
                pendingNfcErase = false;
                nfcWriteActive = false;
            }
            notifyNfcWriteResult(false, "Impossibile avviare la modalità di scrittura NFC.");
        }
    }

    private void startNfcErase() {
        if (nfcAdapter == null) {
            notifyNfcEraseResult(false, "Questo telefono non dispone della funzione NFC.");
            return;
        }
        if (!nfcAdapter.isEnabled()) {
            notifyNfcEraseResult(false, "NFC disattivato. Attivalo dalle impostazioni rapide e premi Riprova.");
            return;
        }

        synchronized (nfcWriteLock) {
            pendingNfcUrl = null;
            pendingNfcErase = true;
            nfcWriteActive = true;
        }

        int flags = NfcAdapter.FLAG_READER_NFC_A
                | NfcAdapter.FLAG_READER_NFC_B
                | NfcAdapter.FLAG_READER_NFC_F
                | NfcAdapter.FLAG_READER_NFC_V;
        try {
            nfcAdapter.enableReaderMode(this, this, flags, null);
        } catch (Exception error) {
            synchronized (nfcWriteLock) {
                pendingNfcUrl = null;
                pendingNfcErase = false;
                nfcWriteActive = false;
            }
            notifyNfcEraseResult(false, "Impossibile avviare la modalità di azzeramento NFC.");
        }
    }

    private boolean isAllowedNfcUrl(String value) {
        try {
            Uri uri = Uri.parse(value);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(scheme) || host == null) return false;
            String normalizedHost = host.toLowerCase(Locale.ROOT);
            return "tapreputa.github.io".equals(normalizedHost)
                    || "search.google.com".equals(normalizedHost)
                    || "www.google.com".equals(normalizedHost)
                    || "google.com".equals(normalizedHost)
                    || "g.page".equals(normalizedHost)
                    || "maps.app.goo.gl".equals(normalizedHost);
        } catch (Exception ignored) {
            return false;
        }
    }

    @Override
    public void onTagDiscovered(Tag tag) {
        final String url;
        final boolean erase;
        synchronized (nfcWriteLock) {
            if (!nfcWriteActive || (!pendingNfcErase && pendingNfcUrl == null)) return;
            nfcWriteActive = false;
            url = pendingNfcUrl;
            erase = pendingNfcErase;
        }

        boolean success = false;
        String resultMessage;
        try {
            NdefRecord record = erase
                    ? new NdefRecord(NdefRecord.TNF_EMPTY, new byte[0], new byte[0], new byte[0])
                    : NdefRecord.createUri(url);
            NdefMessage message = new NdefMessage(new NdefRecord[]{record});
            Ndef ndef = Ndef.get(tag);
            if (ndef != null) {
                try {
                    ndef.connect();
                    if (!ndef.isWritable()) {
                        resultMessage = "La card NFC è protetta e non può essere riscritta.";
                    } else if (message.toByteArray().length > ndef.getMaxSize()) {
                        resultMessage = "La memoria della card NFC non è sufficiente per questo link.";
                    } else {
                        ndef.writeNdefMessage(message);
                        success = true;
                        resultMessage = erase
                                ? "La card è vuota e pronta per una nuova programmazione."
                                : "Il link è stato scritto sulla card NFC.";
                    }
                } finally {
                    try { ndef.close(); } catch (IOException ignored) {}
                }
            } else {
                NdefFormatable formatable = NdefFormatable.get(tag);
                if (formatable == null) {
                    resultMessage = "Questa card non è compatibile con la scrittura NDEF.";
                } else {
                    try {
                        formatable.connect();
                        formatable.format(message);
                        success = true;
                        resultMessage = erase
                                ? "La card è stata formattata ed è pronta per una nuova programmazione."
                                : "La card è stata formattata e il link è stato scritto.";
                    } finally {
                        try { formatable.close(); } catch (IOException ignored) {}
                    }
                }
            }
        } catch (android.nfc.TagLostException error) {
            resultMessage = "Card allontanata troppo presto. Mantienila ferma e premi Riprova.";
        } catch (android.nfc.FormatException error) {
            resultMessage = "La card NFC usa un formato non compatibile.";
        } catch (IOException error) {
            resultMessage = "Scrittura interrotta. Mantieni la card ferma sul telefono e riprova.";
        } catch (Exception error) {
            resultMessage = "Scrittura NFC non riuscita. Riprova con un’altra card.";
        }

        final boolean completed = success;
        final String completedMessage = resultMessage;
        runOnUiThread(() -> {
            disableNfcReaderMode();
            synchronized (nfcWriteLock) {
                pendingNfcUrl = null;
                pendingNfcErase = false;
                nfcWriteActive = false;
            }
            if (erase) {
                notifyNfcEraseResult(completed, completedMessage);
            } else {
                notifyNfcWriteResult(completed, completedMessage);
            }
            if (completed) {
                Toast.makeText(MainActivity.this, erase ? "Card NFC azzerata" : "Scrittura NFC completata", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void notifyNfcWriteResult(boolean success, String message) {
        String payload = "{\"success\":" + success + ",\"message\":" + JSONObject.quote(message) + "}";
        String script = "window.TapNfcWriterNativeResult&&window.TapNfcWriterNativeResult(" + payload + ");";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void notifyNfcEraseResult(boolean success, String message) {
        String payload = "{\"success\":" + success + ",\"message\":" + JSONObject.quote(message) + "}";
        String script = "window.TapNfcEraserNativeResult&&window.TapNfcEraserNativeResult(" + payload + ");";
        runOnUiThread(() -> webView.evaluateJavascript(script, null));
    }

    private void disableNfcReaderMode() {
        if (nfcAdapter == null) return;
        try { nfcAdapter.disableReaderMode(this); } catch (Exception ignored) {}
    }

    private void cancelNfcWriteInternal() {
        synchronized (nfcWriteLock) {
            pendingNfcUrl = null;
            pendingNfcErase = false;
            nfcWriteActive = false;
        }
        disableNfcReaderMode();
    }

    private boolean handleNavigation(Uri uri) {
        String scheme = uri.getScheme();

        if ("blob".equalsIgnoreCase(scheme) || "data".equalsIgnoreCase(scheme) || "about".equalsIgnoreCase(scheme)) {
            return false;
        }

        String host = uri.getHost();
        String path = uri.getPath();

        boolean isTapreputaManager = "tapreputa.github.io".equalsIgnoreCase(host)
                && path != null
                && path.startsWith("/Scheda-nuovo-Cliente/");

        if (isTapreputaManager) {
            return false;
        }

        openExternal(uri);
        return true;
    }

    private boolean handlePopupNavigation(Uri uri) {
        String scheme = uri.getScheme();

        if ("blob".equalsIgnoreCase(scheme) || "data".equalsIgnoreCase(scheme)) {
            webView.loadUrl(uri.toString());
            return true;
        }

        if ("about".equalsIgnoreCase(scheme)) {
            return false;
        }

        openExternal(uri);
        return true;
    }

    private void openExternal(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            startActivity(intent);
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "Impossibile aprire questo collegamento.", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onPause() {
        cancelNfcWriteInternal();
        super.onPause();
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
