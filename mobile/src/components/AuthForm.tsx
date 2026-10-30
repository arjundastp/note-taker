import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ApiError } from "../api/core";
import { theme } from "../lib/theme";

interface Props {
  title: string;
  cta: string;
  onSubmit: (email: string, password: string) => Promise<void>;
  footer: React.ReactNode;
}

export function AuthForm({ title, cta, onSubmit, footer }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(email.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const disabled = busy || !email.trim() || password.length < 8;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.sub}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password (min 8 characters)"
        placeholderTextColor={theme.sub}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable
        style={[styles.button, disabled && styles.buttonOff]}
        disabled={disabled}
        onPress={submit}
      >
        {busy ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>{cta}</Text>
        )}
      </Pressable>
      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", padding: 24, gap: 12, backgroundColor: theme.bg },
  title: { fontSize: 30, fontWeight: "700", color: theme.ink, marginBottom: 12 },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.ink,
  },
  error: { color: theme.danger },
  button: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 4,
  },
  buttonOff: { opacity: 0.4 },
  buttonText: { fontSize: 16, fontWeight: "600", color: "#000" },
  footer: { alignItems: "center", marginTop: 8 },
});
