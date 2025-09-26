import { SignUp } from '@clerk/nextjs';

export default function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Glass Card Container */}
        <div className="backdrop-blur-xl bg-white/30 border border-white/20 rounded-2xl shadow-2xl p-8">
          {/* Clerk SignUp Component */}
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors",
                card: "bg-transparent shadow-none",
                headerTitle: "text-3xl font-bold text-gray-800 mb-2",
                headerSubtitle: "text-gray-600",
                socialButtonsBlockButton: 
                  "bg-white/70 hover:bg-white/90 border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all",
                formFieldInput: 
                  "w-full px-3 py-2 border border-gray-300 bg-white/70 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                dividerLine: "bg-gray-300",
                dividerText: "text-gray-500",
                footerActionLink: "text-blue-600 hover:text-blue-700 font-medium"
              },
              layout: {
                socialButtonsPlacement: "bottom"
              }
            }}
            redirectUrl="/profil?required=true"
            signInUrl="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}