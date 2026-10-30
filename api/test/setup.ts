// Load the throwaway test database + secret before env.ts validates them.
import { config } from "dotenv";
config({ path: ".env.test", override: true });
