import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { auth } from "@/firebase";

/**
 * Sign up with email & password
 */
export const registerUser = async (
  email: string,
  password: string
): Promise<User> => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Login with email & password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

/**
 * Logout current user
 */
export const logoutUser = async (): Promise<void> => {
  await signOut(auth);
};
