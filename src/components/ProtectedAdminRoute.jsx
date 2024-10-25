import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth, db } from "../configs/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

const ProtectedAdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          setIsAdmin(role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin status: ", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkAdmin();
      } else {
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default ProtectedAdminRoute;
