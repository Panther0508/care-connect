import { SignIn } from '@clerk/clerk-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-slate-800 shadow-2xl border border-slate-700 rounded-xl',
              headerTitle: 'text-teal-400',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600',
              formButtonPrimary: 'bg-teal-600 hover:bg-teal-500 text-white',
              formFieldInput: 'bg-slate-700 border-slate-600 text-white focus:border-teal-500',
              footerActionLink: 'text-teal-400 hover:text-teal-300',
            },
          }}
          routing="path"
          path="/sign-in"
          forceRedirectUrl="/dashboard"
          fallbackRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
