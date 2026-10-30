import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  createNote,
  deleteNote,
  listNotes,
  setPin,
  type NoteListItem,
} from "../../src/api/notes";
import { useAuth } from "../../src/auth/AuthContext";
import { NoteRow } from "../../src/components/NoteRow";
import { theme } from "../../src/lib/theme";

export default function Notes() {
  const router = useRouter();
  const { logout } = useAuth();
  const [notes, setNotes] = useState<NoteListItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setNotes(await listNotes());
    } catch {
      setNotes([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function newNote(kind: "text" | "sketch") {
    const note = await createNote(kind);
    router.push(kind === "sketch" ? `/notes/sketch/${note.id}` : `/notes/${note.id}`);
  }

  function openNote(n: NoteListItem) {
    router.push(n.kind === "sketch" ? `/notes/sketch/${n.id}` : `/notes/${n.id}`);
  }

  function rowActions(n: NoteListItem) {
    Alert.alert(n.title || "Untitled", undefined, [
      {
        text: n.isPinned ? "Unpin" : "Pin",
        onPress: async () => {
          await setPin(n.id, !n.isPinned);
          load();
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert("Delete note?", "This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            {
              text: "Delete",
              style: "destructive",
              onPress: async () => {
                await deleteNote(n.id);
                load();
              },
            },
          ]),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const insets = useSafeAreaInsets();

  if (notes === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.heading}>Notes</Text>
        <Pressable onPress={logout} hitSlop={10}>
          <Text style={styles.signout}>Sign out</Text>
        </Pressable>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        renderItem={({ item }) => (
          <NoteRow
            note={item}
            onPress={() => openNote(item)}
            onLongPress={() => rowActions(item)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <Text style={styles.empty}>No notes yet. Tap + to start.</Text>
        }
        contentContainerStyle={notes.length === 0 && styles.emptyWrap}
      />

      <View style={[styles.fabRow, { bottom: insets.bottom + 20 }]}>
        <Pressable style={[styles.fab, styles.fabSketch]} onPress={() => newNote("sketch")}>
          <Text style={styles.fabIcon}>✎</Text>
        </Pressable>
        <Pressable style={styles.fab} onPress={() => newNote("text")}>
          <Text style={styles.fabIcon}>＋</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heading: { fontSize: 34, fontWeight: "800", color: theme.ink },
  signout: { color: theme.sub, fontSize: 15 },
  sep: { height: 1, backgroundColor: theme.line, marginLeft: 64 },
  empty: { color: theme.sub, textAlign: "center" },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  fabRow: { position: "absolute", right: 20, flexDirection: "row", gap: 12 },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  fabSketch: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.line },
  fabIcon: { fontSize: 26, color: theme.ink },
});
