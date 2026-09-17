import { Link, useNavigate } from 'react-router-dom'
import { Home, Search, ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="container-app py-16 max-w-2xl">
      <div className="card relative overflow-hidden text-center">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-accent-300/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
            <Compass size={28} className="text-white" />
          </div>

          <h1 className="mt-6 text-6xl font-extrabold gradient-text">404</h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Page not found
          </h2>
          <p className="mt-3 text-gray-500 max-w-md mx-auto leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">
              <Home size={16} /> Go home
            </Link>
            <Link to="/jobs" className="btn-outline">
              <Search size={16} /> Browse jobs
            </Link>
            <button onClick={() => navigate(-1)} className="btn-ghost">
              <ArrowLeft size={16} /> Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}