import { BriefcaseIcon, FileTextIcon, SparklesIcon, DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initiateGoogleLogin } from "@/api/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

const features = [
  {
    icon: BriefcaseIcon,
    title: "Track Every Application",
    desc: "Keep all your job applications in one place with rich status tracking — from first apply to final offer.",
  },
  {
    icon: FileTextIcon,
    title: "Manage Your Documents",
    desc: "Write and version your resumes and cover letters in Markdown with a live preview editor.",
  },
  {
    icon: DownloadIcon,
    title: "Export to PDF",
    desc: "Download any document as a professionally formatted, print-ready PDF in one click.",
  },
  {
    icon: SparklesIcon,
    title: "AI Cover Letter Review",
    desc: "Get instant AI-powered feedback on your cover letter tailored to the job description.",
  },
];

const steps = [
  { n: "1", title: "Sign in with Google", desc: "One click, no password needed." },
  { n: "2", title: "Add your applications", desc: "Log each role with status, JD, salary, and more." },
  { n: "3", title: "Craft your documents", desc: "Edit resumes & cover letters, get AI feedback, export to PDF." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-gray-900">
            <BriefcaseIcon className="h-5 w-5 text-blue-600" />
            JobTrackr
          </div>
          <Button onClick={initiateGoogleLogin} variant="outline" size="sm">
            <GoogleIcon />
            Sign in
          </Button>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
            <SparklesIcon className="h-3 w-3" />
            Powered by Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            Track every job application.{" "}
            <span className="text-blue-600">Land your next role.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            JobTrackr keeps your entire job search organized — applications, statuses, resumes, cover letters, and AI feedback — all in one place.
          </p>
          <Button onClick={initiateGoogleLogin} size="lg" className="gap-3 text-base px-8 py-3 h-auto shadow-lg">
            <GoogleIcon />
            Continue with Google
          </Button>
          <p className="mt-4 text-sm text-gray-400">Free to use · No credit card required</p>
        </section>

        {/* Features */}
        <section className="bg-gray-50 border-y border-gray-200 py-20">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Everything you need to stay on top of your search</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Get started in minutes</h2>
          <div className="space-y-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex items-start gap-5 text-left">
                <div className="flex-none w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {n}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-14">
            <Button onClick={initiateGoogleLogin} size="lg" className="gap-3 text-base px-8 py-3 h-auto">
              <GoogleIcon />
              Get started — it's free
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8 text-center text-sm text-gray-400">
        <p>JobTrackr · Built with FastAPI + React + Claude AI</p>
      </footer>
    </div>
  );
}
