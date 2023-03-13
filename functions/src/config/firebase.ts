import * as admin from "firebase-admin";
import account from "../../serviceAccount.json";

const serviceAccount = account as admin.ServiceAccount;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://notibelo.firebaseio.com",
});

const db = admin.firestore();

export { admin, db };
