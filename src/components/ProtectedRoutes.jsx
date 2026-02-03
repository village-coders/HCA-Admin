import { useEffect } from "react"
import { Navigate, Outlet, useNavigate } from "react-router-dom"
import { toast } from "sonner"

import { useAuth } from "../hooks/useAuth"

const ProtectedRoutes = () => {
    // get access token form loacl storage
    const {isAuthenticated} = useAuth();
    const isAuth = isAuthenticated() // true || false
    const navigate = useNavigate()

    useEffect(()=>{
        if(!isAuth){
            toast.warning("Unauthorised. You have to be logged in")
            navigate("/");
        }
    },[isAuth, navigate])

    return isAuth ? <Outlet /> : null
}

export default ProtectedRoutes