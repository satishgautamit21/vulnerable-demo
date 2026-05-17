import { useEffect, useState } from 'react'
import axios from 'axios'
import './PostDetail.css'

function PostDetail({ postId, onClose }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!postId) return

    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await axios.get(
          `https://jsonplaceholder.typicode.com/posts/${postId}`
        )
        setPost(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch post details')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [postId])

  if (!post && !loading) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="post-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>

        {loading && <div className="loading-card">Loading...</div>}

        {error && <div className="error-message">{error}</div>}

        {post && (
          <div className="card-content">
            <h2>{post.title}</h2>
            <p className="post-body">{post.body}</p>
            <div className="post-meta">
              <span>
                <strong>ID:</strong> {post.id}
              </span>
              <span>
                <strong>User ID:</strong> {post.userId}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PostDetail
