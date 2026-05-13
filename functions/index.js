const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.createUser = onCall(async (request) => {
  // Проверяем что вызывает авторизованный пользователь
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Необходима авторизация");
  }

  // Проверяем роль вызывающего
  const callerDoc = await getFirestore()
    .collection("users")
    .doc(request.auth.uid)
    .get();

  if (!callerDoc.exists) {
    throw new HttpsError("permission-denied", "Профиль не найден");
  }

  const callerRole = callerDoc.data().role;
  if (!["superadmin", "director", "dispatcher"].includes(callerRole)) {
    throw new HttpsError("permission-denied", "Недостаточно прав");
  }

  const { email, password, name, role, businessId, cityId, phone } = request.data;

  if (!email || !password || !name || !role) {
    throw new HttpsError("invalid-argument", "Заполните все поля");
  }

  // Создаём пользователя в Firebase Auth
  const userRecord = await getAuth().createUser({
    email,
    password,
    displayName: name,
    phoneNumber: phone || undefined,
  });

  // Создаём профиль в Firestore
  await getFirestore().collection("users").doc(userRecord.uid).set({
    email,
    name,
    role,
    businessId: businessId || "",
    cityId: cityId || "",
    phone: phone || "",
    createdBy: request.auth.uid,
    createdAt: new Date(),
  });

  return { uid: userRecord.uid, success: true };
});

exports.deleteUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Необходима авторизация");
  }

  const callerDoc = await getFirestore()
    .collection("users")
    .doc(request.auth.uid)
    .get();

  const callerRole = callerDoc.data()?.role;
  if (!["superadmin", "director"].includes(callerRole)) {
    throw new HttpsError("permission-denied", "Недостаточно прав");
  }

  const { uid } = request.data;
  if (!uid) throw new HttpsError("invalid-argument", "UID не указан");

  await getAuth().deleteUser(uid);
  await getFirestore().collection("users").doc(uid).delete();

  return { success: true };
});
