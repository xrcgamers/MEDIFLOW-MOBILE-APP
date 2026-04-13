import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "mediflow_auth_token";
const USER_KEY = "mediflow_auth_user";

export async function saveAuthSession(token, user) {
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}