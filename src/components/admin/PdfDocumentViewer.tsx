import * as FileSystem from "expo-file-system/legacy";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const BG     = "#050B15";
const ORANGE = "#FF6500";
const DIM    = "rgba(255,255,255,0.60)";
const MUTED  = "rgba(255,255,255,0.28)";

export type PdfDocumentViewerProps = {
  fileUrl: string;
  fileName: string | null;
};

function buildViewerHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #050B15; overflow-x: hidden; font-family: -apple-system, sans-serif; }
    #loading { color: rgba(255,255,255,0.55); text-align: center; padding: 56px 16px; font-size: 14px; }
    #error { display: none; text-align: center; padding: 56px 24px; }
    #error h3 { color: #ffffff; font-size: 16px; margin-bottom: 10px; font-weight: 600; }
    #error p  { color: rgba(255,255,255,0.45); font-size: 13px; }
    #pages { padding: 12px; padding-bottom: 68px; }
    canvas { display: block; width: 100%; margin-bottom: 10px; border-radius: 4px; background: #fff; }
    #toolbar {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; gap: 8px; padding: 10px 16px;
      background: rgba(8,15,29,0.96);
      border-top: 1px solid rgba(255,255,255,0.07);
      z-index: 100;
    }
    .btn {
      flex: 1;
      color: rgba(255,255,255,0.80);
      background: rgba(255,255,255,0.09);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 10px;
      padding: 10px 4px;
      font-size: 13px;
      cursor: pointer;
      text-align: center;
      -webkit-tap-highlight-color: transparent;
    }
    .btn:active { background: rgba(255,255,255,0.18); }
  </style>
</head>
<body>
  <div id="loading">Loading PDF…</div>
  <div id="error">
    <h3>PDF preview failed</h3>
    <p>Please try again</p>
  </div>
  <div id="pages"></div>
  <div id="toolbar">
    <button class="btn" onclick="zoom(-0.25)">Zoom Out −</button>
    <button class="btn" onclick="resetZoom()">Reset</button>
    <button class="btn" onclick="zoom(0.25)">Zoom In +</button>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    var scale   = 1.5;
    var pdfDoc  = null;
    var b64Data = '${base64}';

    function decodeB64(s) {
      var raw = atob(s);
      var buf = new Uint8Array(raw.length);
      for (var i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
      return buf;
    }

    async function renderAll() {
      var container = document.getElementById('pages');
      container.innerHTML = '';
      for (var n = 1; n <= pdfDoc.numPages; n++) {
        var page = await pdfDoc.getPage(n);
        var vp   = page.getViewport({ scale: scale });
        var cvs  = document.createElement('canvas');
        cvs.width  = vp.width;
        cvs.height = vp.height;
        container.appendChild(cvs);
        await page.render({ canvasContext: cvs.getContext('2d'), viewport: vp }).promise;
      }
    }

    async function init() {
      try {
        var data = decodeB64(b64Data);
        pdfDoc = await pdfjsLib.getDocument({ data: data }).promise;
        document.getElementById('loading').style.display = 'none';
        await renderAll();
      } catch (e) {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display  = 'block';
      }
    }

    function zoom(delta) {
      scale = Math.max(0.5, Math.min(scale + delta, 4.0));
      if (pdfDoc) renderAll();
    }

    function resetZoom() {
      scale = 1.5;
      if (pdfDoc) renderAll();
    }

    init();
  </script>
</body>
</html>`;
}

export default function PdfDocumentViewer({ fileUrl }: PdfDocumentViewerProps) {
  const [status,  setStatus]  = useState<"loading" | "ready" | "error">("loading");
  const [html,    setHtml]    = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setHtml(null);

    (async () => {
      try {
        const localUri = (FileSystem.cacheDirectory ?? "") + "gxs_pdf_preview.pdf";
        const dl = await FileSystem.downloadAsync(fileUrl, localUri);
        if (cancelled) return;

        if (dl.status !== 200) throw new Error("Download failed");

        const b64 = await FileSystem.readAsStringAsync(dl.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (cancelled) return;

        setHtml(buildViewerHtml(b64));
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => { cancelled = true; };
  }, [fileUrl]);

  if (status === "loading") {
    return (
      <View style={st.center}>
        <ActivityIndicator color={ORANGE} size="large" />
        <Text style={st.loadingText}>Loading PDF…</Text>
      </View>
    );
  }

  if (status === "error" || !html) {
    return (
      <View style={st.center}>
        <Text style={st.errorTitle}>PDF preview failed</Text>
        <Text style={st.errorSub}>Please try again</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ html, baseUrl: "" }}
      style={st.webview}
      originWhitelist={["*"]}
      javaScriptEnabled
      domStorageEnabled
      scalesPageToFit={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      scrollEnabled
    />
  );
}

const st = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  loadingText: { fontFamily: "Poppins_400Regular", fontSize: 13, color: DIM },
  errorTitle:  { fontFamily: "Poppins_600SemiBold", fontSize: 15, color: "#FFFFFF", textAlign: "center" },
  errorSub:    { fontFamily: "Poppins_400Regular",  fontSize: 12, color: MUTED, textAlign: "center" },
  webview:     { flex: 1, backgroundColor: BG },
});
