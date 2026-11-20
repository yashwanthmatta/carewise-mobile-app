import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// On iOS and Android, sign-in tokens and settings live in the phone's secure storage (Keychain / Keystore).
// The web preview has no secure storage, and copying tokens into localStorage would be weaker than the
// app, so on web they are kept in memory only: sign-in lasts until the tab is closed or reloaded.
const memory = new Map<string, string>();
const isWeb = Platform.OS === "web";

export function getItemAsync(key: string): Promise<string | null> {
  return isWeb ? Promise.resolve(memory.get(key) ?? null) : SecureStore.getItemAsync(key);
}

export function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    memory.set(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
}

export function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    memory.delete(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
}
