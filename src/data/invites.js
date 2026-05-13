import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

// Генерация случайного кода
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Создать приглашение
export async function createInvite({ name, role, businessId, cityId, createdBy }) {
  const code = generateCode();
  await addDoc(collection(db, "invites"), {
    code,
    name,
    role,
    businessId: businessId || "",
    cityId: cityId || "",
    createdBy,
    used: false,
    createdAt: serverTimestamp(),
  });
  return code;
}

// Проверить код приглашения
export async function checkInvite(code) {
  const q = query(
    collection(db, "invites"),
    where("code", "==", code.toUpperCase()),
    where("used", "==", false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Отметить код как использованный
export async function markInviteUsed(inviteId, uid) {
  await updateDoc(doc(db, "invites", inviteId), {
    used: true,
    usedBy: uid,
    usedAt: serverTimestamp(),
  });
          }
