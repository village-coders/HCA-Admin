import { HiCheckBadge } from "react-icons/hi2";

const VerifyEmail = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-10 text-center">
        {/* Success Icon */}
        <div className="mx-auto mb-6 flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
          <HiCheckBadge className="text-green-600 text-5xl" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-gray-800">
          Email Verified Successfully
        </h1>


        <p className="text-gray-600 mt-4 leading-relaxed">
          Your email address has been successfully verified.
        </p>

        <p className="text-gray-600 mt-2 leading-relaxed">
          A super admin has created an administrator account for you. You can
          now access the admin portal using your registered email address.
        </p>

       
        <a
          href="/"
          className="inline-block mt-8 px-8 py-3 rounded-lg
          bg-green-600 text-white font-medium hover:bg-green-700 transition"
        >
          Go to Admin Login
        </a>

        {/* Footer */}
        <p className="mt-8 text-xs text-gray-400">
          If you believe this account was created in error, please contact the
          system administrator.
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
