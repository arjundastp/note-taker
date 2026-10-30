import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { createApi } from "./core";

export const baseUrl: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "http://localhost:3000";

const REFRESH_KEY = "notes.refresh";

let access: string | null = null;
let logoutHandler: () => void = () => {};

/** AuthContext registers here so a dead refresh token routes the UI to login. */
export function setLogoutHandler(fn: () => void) {
  logoutHandler = fn;
}

const impl = createApi({
  baseUrl,
  getAccess: () => access,
  setAccess: (t) => {
    access = t;
  },
  getRefresh: () => SecureStore.getItemAsync(REFRESH_KEY),
  setRefresh: async (t) => {
    if (t) await SecureStore.setItemAsync(REFRESH_KEY, t);
    else await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
  onLogout: () => logoutHandler(),
  fetchFn: (input, init) => fetch(input as string, init),
});

export const api = impl.api;
export const request = impl.request;
export const refresh = impl.refresh;

export async function setSession(accessToken: string, refreshToken: string) {
  access = accessToken;
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export async function clearSession() {
  access = null;
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

/** For <Image> headers when loading a protected sketch PNG. */
export const authHeader = () =>
  access ? { Authorization: `Bearer ${access}` } : {};
