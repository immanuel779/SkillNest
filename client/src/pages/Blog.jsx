import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ArrowRight, BookOpen, Clock, Search, Sparkles } from 'lucide-react'
import { listPublishedBlogPosts } from '../services/blogService'

export default function Blog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    listPublishedBlogPosts().then(data => {
      setPosts(data)
      setLoading(false)
    })
  }, [])

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.excerpt?.toLowerCase().includes(search.toLowerCase())
  )

  const featuredPost = filteredPosts[0]
  const otherPosts = filteredPosts.slice(1)

  return (
    <div className="bg-gray-50/50 min-h-screen pb-20 font-sans">
      
      {/* DARK HERO */}
      <div className="bg-[#0f172a] text-white pt-16 pb-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#7c3aed]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="container-app relative text-center max-w-3xl z-10">
          <span className="inline-flex items-center gap-1.5 text-[#7c3aed] bg-[#7c3aed]/10 border border-[#7c3aed]/20 font-bold tracking-widest uppercase text-xs mb-5 px-4 py-1.5 rounded-full">
            <BookOpen size={14} /> SkillNest Insights
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Career advice & <br /> <span className="text-[#7c3aed]">hiring insights</span>
          </h1>
          <p className="mt-5 text-gray-400 text-lg max-w-2xl mx-auto">
            Expert tips on getting hired, building remote teams, and navigating the future of work in Nigeria.
          </p>

          <div className="mt-8 relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search articles..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-full py-3.5 pl-12 pr-4 outline-none font-medium shadow-xl focus:ring-4 focus:ring-[#7c3aed]/30 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="container-app max-w-6xl relative z-20 -mt-16">
        {loading ? (
          <div className="grid gap-6">
            <div className="h-96 bg-white rounded-3xl animate-pulse shadow-sm" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-100">
            <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No articles found</h3>
            <p className="text-gray-500 mt-2">Check back soon for new insights and career tips.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* FEATURED POST */}
            {featuredPost && (
              <Link to={`/blog/${featuredPost.id}`} className="block group">
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:flex-row transition-transform duration-300 hover:-translate-y-1">
                  <div className="md:w-1/2 h-64 md:h-auto bg-gray-100 relative overflow-hidden">
                    {featuredPost.coverImage ? (
                      <img src={featuredPost.coverImage} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#f8fafc]">
                        <BookOpen size={48} className="text-gray-300" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-[#7c3aed] text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                      <Sparkles size={12} /> Featured
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar size={14}/> {featuredPost.publishedAt?.seconds ? new Date(featuredPost.publishedAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                      <span className="flex items-center gap-1"><Clock size={14}/> 5 min read</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight group-hover:text-[#7c3aed] transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="text-gray-600 mt-4 line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-[#7c3aed] font-bold">
                      Read Full Article <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* GRID OF OTHER POSTS */}
            {otherPosts.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherPosts.map(post => (
                  <Link key={post.id} to={`/blog/${post.id}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300">
                    <div className="h-48 bg-gray-100 relative overflow-hidden shrink-0">
                      {post.coverImage ? (
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#f8fafc]">
                          <BookOpen size={32} className="text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                        <span>{post.publishedAt?.seconds ? new Date(post.publishedAt.seconds * 1000).toLocaleDateString() : 'Recently'}</span>
                        <span>•</span>
                        <span>4 min read</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 leading-snug group-hover:text-[#7c3aed] transition-colors line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 flex-1">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center text-[#7c3aed] text-sm font-bold">
                        Read Article <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}