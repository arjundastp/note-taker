import { View, Text, Pressable } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { theme } from "../../src/lib/theme";

// Placeholder — replaced by the real list in Task 6.
export default function Notes() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16, backgroundColor: theme.bg }}>
      <Text style={{ color: theme.ink }}>Signed in as {user?.email}</Text>
      <Pressable onPress={logout}>
        <Text style={{ color: theme.accent }}>Sign out</Text>
      </Pressable>
    </View>
  );
}
