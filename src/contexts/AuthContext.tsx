"use client"

import { createContext, useState, useEffect, useContext } from "react"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"

const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribeAuth = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser(firebaseUser)

        // Fetch additional user profile data from Firestore
        const userDoc = await firestore().collection("users").doc(firebaseUser.uid).get()

        if (userDoc.exists) {
          setUserProfile(userDoc.data())
        } else {
          // Create a new user profile if it doesn't exist
          const newUserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            createdAt: firestore.FieldValue.serverTimestamp(),
            dietaryPreferences: [],
            favoriteVendors: [],
            reviewCount: 0,
          }

          await firestore().collection("users").doc(firebaseUser.uid).set(newUserProfile)
          setUserProfile(newUserProfile)
        }
      } else {
        // User is signed out
        setUser(null)
        setUserProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password)
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Sign up with email and password
  const signUp = async (email, password, displayName) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password)

      // Update the user's display name
      await userCredential.user.updateProfile({
        displayName: displayName,
      })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      await auth().signOut()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  // Update user profile
  const updateProfile = async (data) => {
    try {
      const currentUser = auth().currentUser

      if (data.displayName) {
        await currentUser.updateProfile({
          displayName: data.displayName,
        })
      }

      if (data.photoURL) {
        await currentUser.updateProfile({
          photoURL: data.photoURL,
        })
      }

      // Update additional profile data in Firestore
      await firestore().collection("users").doc(currentUser.uid).update(data)

      // Refresh the user profile
      const updatedUserDoc = await firestore().collection("users").doc(currentUser.uid).get()
      setUserProfile(updatedUserDoc.data())

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
