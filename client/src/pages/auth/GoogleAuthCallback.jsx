import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userData = params.get("user");
    const error = params.get("error");

    if (error) {
      console.error("Google auth error:", error);
      // Show error message to user
      navigate("/login", { 
        state: { 
          message: decodeURIComponent(error), 
          type: "error" 
        } 
      });
      return;
    }

    if (token && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", token);
        localStorage.setItem("userType", "user");
        
        console.log("Google user stored:", { userId: user._id, email: user.email });
        
        const isNewUser = user.isNewUser;
        
        if (isNewUser) {
          navigate("/service-listing", { 
            state: { message: "Account created successfully! Welcome to ServEase!" } 
          });
        } else {
          navigate("/service-listing", { 
            state: { message: "Welcome back! You have successfully logged in." } 
          });
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        navigate("/login", { 
          state: { message: "Authentication failed. Please try again.", type: "error" } 
        });
      }
    } else {
      navigate("/login", { 
        state: { message: "Authentication failed. Please try again.", type: "error" } 
      });
    }
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-500 mt-4">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleAuthCallback;