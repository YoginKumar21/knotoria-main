import { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const UserAuthContext = createContext(null);

export function UserAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signUpWithEmail = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    
    // Enforce role assignment: Only admin@knotoria.com gets "admin" role
    const role = email.toLowerCase() === "admin@knotoria.com" ? "admin" : "user";
    
    await setDoc(doc(db, "users", userCredential.user.uid), {
      name: name || "",
      email: email,
      phone: "",
      role: role,
      created_at: new Date().toISOString()
    });

    return userCredential.user;
  };

  const signInWithEmail = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    const userDocRef = doc(db, "users", userCredential.user.uid);
    const userSnapshot = await getDoc(userDocRef);
    if (!userSnapshot.exists()) {
      const email = userCredential.user.email || "";
      const role = email.toLowerCase() === "admin@knotoria.com" ? "admin" : "user";
      await setDoc(userDocRef, {
        name: userCredential.user.displayName || "",
        email: email,
        phone: userCredential.user.phoneNumber || "",
        role: role,
        created_at: new Date().toISOString()
      });
    }
    return userCredential.user;
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    signUpWithEmail,
    signInWithEmail,
    signInWithGoogle,
    logout,
  };

  return (
    <UserAuthContext.Provider value={value}>
      {!loading && children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const ctx = useContext(UserAuthContext);
  if (ctx === undefined) {
    throw new Error("useUserAuth must be used within a UserAuthProvider");
  }
  return ctx;
}
