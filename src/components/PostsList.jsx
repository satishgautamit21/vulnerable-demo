import { useState, useEffect } from 'react'
import axios from 'axios'
import PostDetail from './PostDetail'
import './PostsList.css'

function PostsList() {
  const [posts, setPosts] = useState([])
  const [selectedPostId, setSelectedPostId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts')
        setPosts(response.data)
        setError(null)
      } catch (err) {
        setError('Failed to fetch posts')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const handleLoadPost = (id) => {
    setSelectedPostId(id)
  }

  const handleCloseDetail = () => {
    setSelectedPostId(null)
  }

  return (
    <div className="posts-container">
      <h1>Posts List</h1>

      {error && <div className="error-message">{error}</div>}

      {loading && <div className="loading">Loading...</div>}

      {posts.length > 0 && (
        <div className="table-wrapper">
          <table className="posts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>User ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {posts.slice(0, 10).map((post) => (
                <tr key={post.id}>
                  <td>{post.id}</td>
                  <td>{post.title}</td>
                  <td>{post.userId}</td>
                  <td>
                    <button
                      className="load-btn"
                      onClick={() => handleLoadPost(post.id)}
                      disabled={loading}
                    >
                      View Post
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedPostId && (
        <PostDetail
          postId={selectedPostId}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  )
}

export default PostsList
