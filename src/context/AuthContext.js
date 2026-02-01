import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isConfigured } from '../config/firebase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  const loadUserProfile = useCallback(async (uid) => {
    if (!isConfigured || !db) {
      console.log('[Auth] Firebase not configured, skipping profile load');
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        setNeedsProfileSetup(false);

        // Update last login
        await updateDoc(doc(db, 'users', uid), {
          lastLogin: serverTimestamp(),
        });

        return profile;
      } else {
        // User exists in Auth but not in Firestore - needs profile setup
        setNeedsProfileSetup(true);
        return null;
      }
    } catch (error) {
      console.error('[Auth] Error loading user profile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      console.log('[Auth] Auth not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[Auth] Auth state changed:', firebaseUser ? 'logged in' : 'logged out');

      if (firebaseUser) {
        setUser(firebaseUser);
        await loadUserProfile(firebaseUser.uid);
      } else {
        setUser(null);
        setUserProfile(null);
        setNeedsProfileSetup(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [loadUserProfile]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setNeedsProfileSetup(false);
      console.log('[Auth] Signed out successfully');
    } catch (error) {
      console.error('[Auth] Error signing out:', error);
      throw error;
    }
  };

  const createUserProfile = async (profileData) => {
    if (!user || !db) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    try {
      const fullProfile = {
        uid: user.uid,
        phoneNumber: user.phoneNumber || null,
        email: user.email || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        stats: {
          reviewsCount: 0,
          favoritesCount: 0,
          restroomsAdded: 0,
        },
        ...profileData,
      };

      await setDoc(doc(db, 'users', user.uid), fullProfile);
      setUserProfile(fullProfile);
      setNeedsProfileSetup(false);
      console.log('[Auth] User profile created');
      return fullProfile;
    } catch (error) {
      console.error('[Auth] Error creating user profile:', error);
      throw error;
    }
  };

  const updateUserProfile = async (updates) => {
    if (!user || !db) {
      throw new Error('User not authenticated or Firebase not configured');
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserProfile(prev => ({ ...prev, ...updates }));
      console.log('[Auth] User profile updated');
    } catch (error) {
      console.error('[Auth] Error updating user profile:', error);
      throw error;
    }
  };

  const reloadProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user.uid);
    }
  }, [user, loadUserProfile]);

  const value = {
    user,
    userProfile,
    loading,
    needsProfileSetup,
    isAuthenticated: !!user,
    signOut,
    createUserProfile,
    updateUserProfile,
    reloadProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
