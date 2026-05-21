/**
 * Shown when a user tries to log in but their account has been deactivated.
 * Typically reached after sessionStorage 'accountDeleted' is set and the
 * login-page redirect fires.
 */
export default function AccountDeactivatedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-2xl font-semibold text-gray-800">
        Account Deactivated
      </h1>
      <p className="mt-2 text-gray-500">
        Your account has been deactivated. Please contact support for
        assistance.
      </p>
    </div>
  );
}
