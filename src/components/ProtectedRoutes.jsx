import { useEffect } from "react"
import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "../hooks/useAuth"

const ProtectedRoutes = () => {
    // get access token from local storage
    const { isAuthenticated } = useAuth();
    const isAuth = isAuthenticated(); // true || false
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!isAuth) {
            toast.warning("Unauthorised. You have to be logged in");
            const redirectPath = location.pathname + location.search + location.hash;
            if (redirectPath && redirectPath !== "/") {
                sessionStorage.setItem("admin_redirect", redirectPath);
            }
            const destination = redirectPath && redirectPath !== "/"
                ? `/?redirect=${encodeURIComponent(redirectPath)}`
                : "/";
            navigate(destination, {
                replace: true,
                state: { from: location }
            });
            return;
        }
    }, [isAuth, navigate, location]);

    return isAuth ? <Outlet /> : null;
}

export default ProtectedRoutes