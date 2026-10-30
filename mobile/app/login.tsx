import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import { AuthForm } from "../src/components/AuthForm";
import { useAuth } from "../src/auth/AuthContext";
import { theme } from "../src/lib/theme";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  return (
    <AuthForm
      title="Welcome back"
      cta="Sign in"
      onSubmit={async (email, password) => {
        await login(email, password);
        router.replace("/notes");
      }}
      footer={
        <Link href="/register">
          <Text style={{ color: theme.sub }}>
            New here? <Text style={{ color: theme.ink, fontWeight: "600" }}>Create an account</Text>
          </Text>
        </Link>
      }
    />
  );
}
