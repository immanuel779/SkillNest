import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Share2, User } from 'lucide-react'
import { getBlogPost, incrementBlogViews } from '../services/blogService'

export default function BlogPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBlogPost(id).then(data => {
      if (data) {
        setPost(data)
        incrementBlogViews(id) // Track views
      }
      setLoading(false)
    })
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin"></div></div>
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900">Article not found</h1>
        <button onClick={() => navigate('/blog')} className="text-[#7c3aed] mt-4 font-semibold hover:underline">Go back to Blog</button>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Top Nav area */}
      <div className="bg-[#0f172a] pt-8 pb-32 px-4 sm:px-6 relative">
        <div className="container-app max-w-4xl mx-auto">
          <Link to="/blog" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold mb-8">
            <ArrowLeft size={16} /> Back to all articles
          </Link>
          
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-white font-bold">
                  {post.authorName?.[0] || <User size={14}/>}
                </div>
                <span className="font-semibold text-white">{post.authorName || 'SkillNest Team'}</span>
              </div>
              <div className="flex items-center gap-1.5"><Calendar size={14}/> {post.publishedAt?.seconds ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString() : 'Recently'}</div>
              <div className="flex items-center gap-1.5"><Clock size={14}/> 5 min read</div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      <div className="container-app max-w-3xl mx-auto -mt-16 relative z-10 px-4 sm:px-0">
        {post.coverImage && (
          <img src={post.coverImage} alt={post.title} className="w-full h-64 md:h-96 object-cover rounded-2xl shadow-xl mb-10 border-4 border-white" />
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
          <p className="text-lg text-gray-600 font-medium leading-relaxed mb-8 pb-8 border-b border-gray-100">
            {post.excerpt}
          </p>
          
          {/* Render content - handling line breaks for simple text input */}
          <div className="prose prose-lg prose-purple max-w-none text-gray-800">
            {post.content.split('\n').map((paragraph, i) => (
              <p key={i} className="mb-5 leading-relaxed text-[17px]">{paragraph}</p>
            ))}
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <span className="font-bold text-gray-900">Share this article:</span>
                <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="p-2 bg-gray-100 hover:bg-[#7c3aed] hover:text-white rounded-lg transition-colors" title="Copy Link">
                  <Share2 size={18} />
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}