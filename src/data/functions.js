import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

const functions = getFunctions(app, "us-central1");

export const createUserFn = httpsCallable(functions, "createUser");
export const deleteUserFn = httpsCallable(functions, "deleteUser");
