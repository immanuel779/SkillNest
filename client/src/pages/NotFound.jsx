import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-purple-700">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <Link
        to="/"
        className="mt-8 inline-block bg-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-800"
      >
        Go Home
      </Link>
    </div>
  )
}