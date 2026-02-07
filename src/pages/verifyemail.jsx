import { useEffect } from "react";
import { HiCheckBadge } from "react-icons/hi2";
import { LuBadgeX } from "react-icons/lu";
import { useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { SyncLoader } from "react-spinners";

const VerifyEmail = () => {
  const {token} = useParams()
  const {verifyAccount, verifyingAccount, verificationData} = useAuth()

  const verifyEmail = async () => {
    try {
      await verifyAccount(token)
    } catch (error) {
      console.log(error);      
    }
  }

  console.log(token)
  useEffect(()=> {
    verifyEmail()
  }, [])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 text-center">
        {/* Success Icon */}

        {verifyingAccount ? (
            <SyncLoader size={30} margin={30} color="green"/>
          ) : (
            <>
              {verificationData?.status === "success" ? (
                <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
                  <HiCheckBadge className="text-green-600 text-5xl" />
                </div>
              ) : 
                <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
                  <LuBadgeX className="text-red-600 text-5xl" />
                </div>
              }              


              {/* Heading */}
              <h1 className={`text-2xl font-bold ${verificationData?.status === "success" ? "text-gray-800" : "text-red-600"}`}>
                {verificationData && verificationData?.status.toUpperCase()}
              </h1>


              <p className="text-gray-600 mt-4 leading-relaxed">
                {verificationData && verificationData.message}
              </p>

              <p className="text-gray-600 mt-2 leading-relaxed">
                {verificationData?.status === "success" && "You can now access the admin portal using your registered email address."}
              </p>

            
              {verificationData?.status === "success" && (
                <a
                  href="/"
                  className="inline-block mt-8 px-8 py-3 rounded-lg
                  bg-green-600 text-white font-medium hover:bg-green-700 transition"
                >
                  Go to Admin Login
                </a>
              )}

              {/* Footer */}
              <p className="mt-8 text-xs text-gray-400">
                If you believe this account was created in error, please contact the
                system administrator.
              </p>
            </>
          )}
        
      </div>
    </div>
  );
};

export default VerifyEmail;
