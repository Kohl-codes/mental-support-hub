
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebaseConfig';
import { getDoc, doc } from 'firebase/firestore';

const ProtectedAdminRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, [user]);

  if (loading) return <p>Loading...</p>;
  if (!user || !isAdmin) return <Navigate to="/" />;

  return children;
};

export default ProtectedAdminRoute;
