import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "orders";

export function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, COLLECTION), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  return { orders, loading };
}

export async function createOrder(payload) {
  await addDoc(collection(db, COLLECTION), {
    status: "new",
    courierId: "",
    createdAt: serverTimestamp(),
    ...payload,
  });
}

export async function updateOrder(orderId, patch) {
  await updateDoc(doc(db, COLLECTION, orderId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}
