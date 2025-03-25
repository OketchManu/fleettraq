import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFleet } from "../context/FleetContext";
import { getAuth, signInWithCredential, GoogleAuthProvider } from "firebase/auth";

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useFleet();

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
          
          localStorage.setItem("token", await user.getIdToken());
          localStorage.setItem("role", "user"); // You might want to fetch role from Firestore
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          });
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
  }, [navigate, setUser, location.search]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A0033 0%, #2D0047 100%)" }}>
      <p className="text-white text-xl">Processing authentication...</p>
    </div>
  );
};

export default AuthCallback;