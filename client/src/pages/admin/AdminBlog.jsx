import { useEffect, useState, useRef } from 'react'
import { 
  Plus, Edit, Trash2, Eye, EyeOff, BookOpen, X, 
  Loader2, Save, Upload, Image as ImageIcon 
} from 'lucide-react'
import { listAllBlogPosts, createBlogPost, updateBlogPost, deleteBlogPost } from '../../services/blogService'
import { uploadImage } from '../../services/storageService' // 👈 Imported the upload service
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

export default function AdminBlog() {
  const { user, profile } = useAuth()
  const toast = useToast()
  
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Editor State
  const [showEditor, setShowEditor] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false) // 👈 New state for image upload
  
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    published: false,
  })

  const imageInputRef = useRef(null) // 👈 Ref for the hidden file input

  const loadPosts = async () => {
    setLoading(true)
    const data = await listAllBlogPosts()
    setPosts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadPosts()
  }, [])

  const handleOpenEditor = (post = null) => {
    if (post) {
      setEditingId(post.id)
      setForm({
        title: post.title || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        coverImage: post.coverImage || '',
        published: post.published || false,
      })
    } else {
      setEditingId(null)
      setForm({ title: '', excerpt: '', content: '', coverImage: '', published: false })
    }
    setShowEditor(true)
  }

  // 👇 NEW: Handle Image Upload to Firebase Storage 👇
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 8 * 1024 * 1024) {
      return toast.error('File too large', 'Please upload an image under 8MB.')
    }
    if (!file.type.startsWith('image/')) {
      return toast.error('Invalid file', 'Please upload a valid image file (JPG, PNG).')
    }

    setUploadingImage(true)
    try {
      const url = await uploadImage(`blog/${user.uid}/covers`, file)
      setForm((prev) => ({ ...prev, coverImage: url }))
      toast.success('Image uploaded', 'Cover image is ready.')
    } catch (err) {
      toast.error('Upload failed', err.message)
    } finally {
      setUploadingImage(false)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      return toast.error('Missing fields', 'Title and Content are required.')
    }
    setSaving(true)
    try {
      if (editingId) {
        await updateBlogPost(editingId, form)
        toast.success('Updated', 'Article updated successfully.')
      } else {
        await createBlogPost(form, profile?.fullName || 'Admin', user.uid)
        toast.success('Created', 'Article created successfully.')
      }
      setShowEditor(false)
      loadPosts()
    } catch (err) {
      toast.error('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this article permanently?')) return
    try {
      await deleteBlogPost(id)
      toast.success('Deleted', 'Article removed.')
      loadPosts()
    } catch (err) {
      toast.error('Error', err.message)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <BookOpen className="text-[#7c3aed]" size={28} /> Blog Manager
          </h1>
          <p className="text-gray-500 mt-1">Write and publish articles for the SkillNest community.</p>
        </div>
        <button onClick={() => handleOpenEditor()} className="btn-primary !bg-[#7c3aed] hover:!bg-[#6d28d9] !border-0 !py-2.5 !px-5 shadow-md flex items-center justify-center gap-2">
          <Plus size={18} /> Write New Article
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-[#7c3aed]" size={32} /></div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
          <BookOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No articles yet</h3>
          <p className="text-sm text-gray-500 mt-1">Click "Write New Article" to create your first post.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Article</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Status</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px]">Views</th>
                <th className="px-6 py-4 font-bold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {/* Show small thumbnail if image exists */}
                    {post.coverImage && (
                      <img src={post.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{post.excerpt}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {post.published ? (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full"><Eye size={12}/> Published</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded-full"><EyeOff size={12}/> Draft</span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-700">{post.views || 0}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenEditor(post)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDITOR MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-extrabold text-lg text-gray-900">{editingId ? 'Edit Article' : 'Write New Article'}</h3>
              <button onClick={() => setShowEditor(false)} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Article Title *</label>
                <input className="input text-lg font-bold" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. 5 Tips for Acing Your Next Interview" />
              </div>
              
              {/* 👇 UPGRADED: Image Upload Dropzone 👇 */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cover Image</label>
                
                {/* Hidden File Input */}
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                {form.coverImage ? (
                  <div className="relative rounded-xl border border-gray-200 p-2 bg-gray-50 flex items-center justify-center h-48 group overflow-hidden">
                    <img src={form.coverImage} alt="Cover" className="w-full h-full object-cover rounded-lg" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button 
                        onClick={() => setForm({ ...form, coverImage: '' })}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-lg"
                      >
                        <Trash2 size={16} /> Remove Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#7c3aed] hover:bg-purple-50 transition-colors flex flex-col items-center justify-center gap-2 group"
                  >
                    {uploadingImage ? (
                      <Loader2 size={24} className="text-[#7c3aed] animate-spin" />
                    ) : (
                      <Upload size={24} className="text-gray-400 group-hover:text-[#7c3aed]" />
                    )}
                    <span className="text-xs font-bold text-gray-500 group-hover:text-[#7c3aed]">
                      {uploadingImage ? 'Uploading...' : 'Click to upload cover image'}
                    </span>
                    <span className="text-[10px] text-gray-400">JPG, PNG, WEBP — Max 8MB</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Excerpt / Short Summary *</label>
                <textarea rows={2} className="input resize-none" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} placeholder="A brief 1-2 sentence summary that appears on the blog grid..." />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Article Content *</label>
                <textarea rows={12} className="input resize-none font-mono text-sm" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Write your full article here. You can use line breaks to separate paragraphs..." />
              </div>

              <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-purple-50 transition">
                <input type="checkbox" checked={form.published} onChange={e => setForm({...form, published: e.target.checked})} className="w-5 h-5 accent-[#7c3aed] rounded" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Publish Immediately</p>
                  <p className="text-xs text-gray-500">If unchecked, it will be saved as a draft and hidden from the public.</p>
                </div>
              </label>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowEditor(false)} className="btn-outline !px-6">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploadingImage} className="btn-primary !bg-[#7c3aed] !border-0 !px-8 shadow-md">
                {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                {saving ? 'Saving...' : 'Save Article'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}