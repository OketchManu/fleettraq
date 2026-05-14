import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signInWithCredential, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get("code");

      if (code) {
        try {
          const auth = getAuth();
          const credential = GoogleAuthProvider.credential(null, code);
          const result = await signInWithCredential(auth, credential);
          const user = result.user;

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (!userDoc.exists()) {
            await signOut(auth);
            navigate("/login", {
              replace: true,
              state: {
                authError:
                  "This account is not registered with FleetTraq. Sign up first or contact your fleet administrator.",
              },
            });
            return;
          }

          const data = userDoc.data();
          const role = data.role || "user";

          localStorage.setItem("token", await user.getIdToken());
          localStorage.setItem("role", role);
          navigate("/dashboard", { replace: true });
        } catch (err) {
          console.error("Auth callback error:", err);
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A0033 0%, #2D0047 100%)" }}>
      <p className="text-white text-xl">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;