import { Pressable, StyleSheet, Text, View } from "react-native";
import type { NoteListItem } from "../api/notes";
import { formatNoteDate } from "../lib/date";
import { theme } from "../lib/theme";

interface Props {
  note: NoteListItem;
  onPress: () => void;
  onLongPress: () => void;
}

export function NoteRow({ note, onPress, onLongPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.icon}>
        <Text style={{ fontSize: 18 }}>{note.kind === "sketch" ? "✎" : "≡"}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {note.title || "Untitled"}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {formatNoteDate(note.updatedAt)}
          {note.kind === "sketch" ? "  ·  Drawing" : ""}
        </Text>
      </View>
      {note.isPinned && <Text style={styles.pin}>📌</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: theme.card,
  },
  pressed: { backgroundColor: theme.line },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: theme.ink },
  meta: { fontSize: 13, color: theme.sub, marginTop: 2 },
  pin: { fontSize: 14 },
});
