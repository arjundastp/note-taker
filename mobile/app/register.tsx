import { Link, useRouter } from "expo-router";
import { Text } from "react-native";
import { AuthForm } from "../src/components/AuthForm";
import { useAuth } from "../src/auth/AuthContext";
import { theme } from "../src/lib/theme";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  return (
    <AuthForm
      title="Create account"
      cta="Sign up"
      onSubmit={async (email, password) => {
        await register(email, password);
        router.replace("/notes");
      }}
      footer={
        <Link href="/login">
          <Text style={{ color: theme.sub }}>
            Already have an account? <Text style={{ color: theme.ink, fontWeight: "600" }}>Sign in</Text>
          </Text>
        </Link>
      }
    />
  );
}
