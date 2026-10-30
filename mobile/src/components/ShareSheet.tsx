import * as Clipboard from "expo-clipboard";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { getImageBytes, type Note } from "../api/notes";
import { htmlToMarkdown, htmlToText } from "../lib/share";
import { theme } from "../lib/theme";

interface Props {
  note: Note;
  getHtml?: () => Promise<string>; // text notes only
  onClose: () => void;
}

const safeName = (title: string) =>
  (title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "note").slice(0, 40);

function pdfShell(title: string, bodyHtml: string): string {
  return `<html><head><meta charset="utf-8"/><style>
    body{font-family:-apple-system,system-ui,sans-serif;padding:32px;color:#1c1c1e;line-height:1.5}
    h1,h2,h3{margin:0.6em 0 0.3em}
  </style></head><body><h1>${title}</h1>${bodyHtml}</body></html>`;
}

async function share(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

export function ShareSheet({ note, getHtml, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const isText = typeof getHtml === "function";

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch {
      // Swallow: user can retry; OS share sheet is the feedback.
    } finally {
      setBusy(false);
      onClose();
    }
  }

  const copyText = () =>
    run(async () => {
      const html = await getHtml!();
      await Clipboard.setStringAsync(htmlToText(html));
    });

  const shareMarkdown = () =>
    run(async () => {
      const html = await getHtml!();
      const file = new File(Paths.cache, `${safeName(note.title)}.md`);
      file.create({ overwrite: true });
      await file.write(`# ${note.title}\n\n${htmlToMarkdown(html)}\n`);
      await share(file.uri);
    });

  const shareTextPdf = () =>
    run(async () => {
      const html = await getHtml!();
      const { uri } = await Print.printToFileAsync({ html: pdfShell(note.title, html) });
      await share(uri);
    });

  const shareSketchPdf = () =>
    run(async () => {
      const bytes = await getImageBytes(note.id);
      if (!bytes) return;
      const png = new File(Paths.cache, `${safeName(note.title)}.png`);
      png.create({ overwrite: true });
      await png.write(bytes);
      const b64 = await png.base64();
      const img = `<img src="data:image/png;base64,${b64}" style="width:100%"/>`;
      const { uri } = await Print.printToFileAsync({ html: pdfShell(note.title, img) });
      await share(uri);
    });

  const shareSketchImage = () =>
    run(async () => {
      const bytes = await getImageBytes(note.id);
      if (!bytes) return;
      const png = new File(Paths.cache, `${safeName(note.title)}.png`);
      png.create({ overwrite: true });
      await png.write(bytes);
      await share(png.uri);
    });

  return (
    <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
      <View style={styles.sheet}>
        {busy ? (
          <ActivityIndicator style={{ padding: 20 }} />
        ) : isText ? (
          <>
            <Option label="Copy text" onPress={copyText} />
            <Option label="Share as Markdown (.md)" onPress={shareMarkdown} />
            <Option label="Share as PDF" onPress={shareTextPdf} />
          </>
        ) : (
          <>
            <Option label="Share as PDF" onPress={shareSketchPdf} />
            <Option label="Share image" onPress={shareSketchImage} />
          </>
        )}
        <Option label="Cancel" onPress={onClose} muted />
      </View>
    </Pressable>
  );
}

function Option({
  label,
  onPress,
  muted,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable style={styles.option} onPress={onPress}>
      <Text style={[styles.optionText, muted && { color: theme.sub }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheet: { backgroundColor: theme.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 8, paddingBottom: 28 },
  option: { paddingVertical: 16, paddingHorizontal: 24 },
  optionText: { fontSize: 17, color: theme.ink, textAlign: "center" },
});
