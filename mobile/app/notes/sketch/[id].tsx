import { Skia, type SkImage } from "@shopify/react-native-skia";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getImageBytes, putImage } from "../../../src/api/notes";
import {
  SketchCanvas,
  type SketchHandle,
} from "../../../src/components/SketchCanvas";
import { theme } from "../../../src/lib/theme";

export default function SketchEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const canvas = useRef<SketchHandle>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [background, setBackground] = useState<SkImage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getImageBytes(id)
      .then((bytes) => {
        if (bytes) {
          const data = Skia.Data.fromBytes(bytes);
          setBackground(Skia.Image.MakeImageFromEncoded(data));
        }
      })
      .finally(() => setReady(true));
  }, [id]);

  async function saveAndBack() {
    const png = canvas.current?.snapshotPng();
    if (png && png.length > 0) {
      await putImage(id, png).catch(() => {});
    }
    router.back();
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.bar}>
        <Pressable onPress={saveAndBack} hitSlop={10}>
          <Text style={styles.action}>‹ Save</Text>
        </Pressable>
        <View style={styles.tools}>
          <Tool label="✏️" active={tool === "pen"} onPress={() => setTool("pen")} />
          <Tool label="🩹" active={tool === "eraser"} onPress={() => setTool("eraser")} />
          <Tool label="↶" onPress={() => canvas.current?.undo()} />
          <Tool label="🗑" onPress={() => canvas.current?.clear()} />
        </View>
      </View>

      {ready && (
        <SketchCanvas ref={canvas} tool={tool} background={background} />
      )}
    </View>
  );
}

function Tool({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tool, active && styles.toolActive]}
      hitSlop={6}
    >
      <Text style={{ fontSize: 18 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  action: { color: theme.accent, fontSize: 17 },
  tools: { flexDirection: "row", gap: 6 },
  tool: {
    width: 40,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  toolActive: { backgroundColor: theme.line },
});
