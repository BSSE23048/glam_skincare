import { browserLocalPersistence, createUserWithEmailAndPassword, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { requireFirebase } from './firebase';
import type { Customer } from '../types';
import type { Profile } from '../domain/models';

export async function register(
  name: string,
  email: string,
  password: string,
  phone: string = '',
  whatsapp: string = '',
  defaultShipping?: Customer,
) {
  const { auth, db } = requireFirebase();
  if (password.length < 8) throw new Error('Use at least 8 characters for your password.');
  await setPersistence(auth, browserLocalPersistence);
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(result.user, { displayName: name.trim() });
  
  const userProfile = {
    uid: result.user.uid,
    displayName: name.trim(),
    email: result.user.email,
    phone: phone.trim(),
    whatsapp: whatsapp.trim() || phone.trim(),
    defaultShipping: defaultShipping || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'users', result.user.uid), userProfile);
  return result.user;
}

export async function login(email: string, password: string) {
  const { auth, db } = requireFirebase();
  await setPersistence(auth, browserLocalPersistence);
  const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);
  const ref = doc(db, 'users', user.uid);
  const profile = await getDoc(ref);
  if (!profile.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email,
      phone: '',
      whatsapp: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  return user;
}

export const logout = () => signOut(requireFirebase().auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(requireFirebase().auth, email.trim());

export async function getUserProfile(uid: string): Promise<Profile | null> {
  const { db } = requireFirebase();
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as Profile;
}

export async function updateUserProfile(uid: string, data: Partial<Profile>) {
  const { db } = requireFirebase();
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

