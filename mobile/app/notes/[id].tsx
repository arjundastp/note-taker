import {
  RichText,
  Toolbar,
  useEditorBridge,
  useEditorContent,
} from "@10play/tentap-editor";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getNote, updateNote, type Note } from "../../src/api/notes";
import { ShareSheet } from "../../src/components/ShareSheet";
import { trySave } from "../../src/lib/autosave";
import { formatNoteDate } from "../../src/lib/date";
import { theme } from "../../src/lib/theme";

export default function TextEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState<Note | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const editor = useEditorBridge({ autofocus: false, avoidIosKeyboard: true });
  const content = useEditorContent(editor, { type: "html" });
  const lastSaved = useRef<string | null>(null);

  // Load once, seed the editor.
  useEffect(() => {
    getNote(id).then((n) => {
      setNote(n);
      lastSaved.current = n.bodyHtml ?? "";
      if (n.bodyHtml) editor.setContent(n.bodyHtml);
    });
  }, [id]);

  // Debounced autosave. On a transient failure we leave lastSaved untouched so
  // the next change retries — never silently lose an edit (a stated anti-goal).
  useEffect(() => {
    if (content == null || note == null) return;
    if (content === lastSaved.current) return;
    const t = setTimeout(() => void persist(content), 800);
    return () => clearTimeout(t);
  }, [content, note, id]);

  async function persist(html: string) {
    const outcome = await trySave(() => updateNote(id, html));
    if (outcome === "saved" || outcome === "session-expired") {
      lastSaved.current = html;
      setSaveFailed(false);
    } else {
      setSaveFailed(true); // keep lastSaved stale → retried on next change / back
    }
  }

  async function saveNow() {
    const html = await editor.getHTML();
    if (html !== lastSaved.current) await persist(html);
  }

  if (!note) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bar}>
        <Pressable
          onPress={async () => {
            await saveNow();
            router.back();
          }}
          hitSlop={10}
        >
          <Text style={styles.back}>‹ Notes</Text>
        </Pressable>
        <Pressable onPress={async () => { await saveNow(); setShareOpen(true); }} hitSlop={10}>
          <Text style={styles.share}>Share</Text>
        </Pressable>
      </View>

      <Text style={[styles.date, saveFailed && styles.dateError]}>
        {saveFailed
          ? "Couldn't save — will retry"
          : `${formatNoteDate(note.createdAt)} · edited ${formatNoteDate(note.updatedAt)}`}
      </Text>

      <RichText editor={editor} style={styles.editor} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>

      {shareOpen && (
        <ShareSheet
          note={note}
          getHtml={() => editor.getHTML()}
          onClose={() => setShareOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.paper },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  back: { color: theme.accent, fontSize: 17 },
  share: { color: theme.accent, fontSize: 17 },
  date: { color: theme.sub, fontSize: 12, textAlign: "center", paddingBottom: 6 },
  dateError: { color: theme.danger },
  editor: { flex: 1, backgroundColor: theme.paper },
});
