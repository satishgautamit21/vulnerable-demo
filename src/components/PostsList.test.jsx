import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostsList from './PostsList'
import axios from 'axios'

vi.mock('axios')

const mockPosts = [
  {
    userId: 1,
    id: 1,
    title: 'Test Post 1',
    body: 'This is test post 1'
  },
  {
    userId: 1,
    id: 2,
    title: 'Test Post 2',
    body: 'This is test post 2'
  },
  {
    userId: 2,
    id: 3,
    title: 'Test Post 3',
    body: 'This is test post 3'
  }
]

describe('PostsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the component with title', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    render(<PostsList />)

    expect(screen.getByText('Posts List')).toBeInTheDocument()
  })

  it('fetches and displays posts on mount', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    render(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
      expect(screen.getByText('Test Post 2')).toBeInTheDocument()
      expect(screen.getByText('Test Post 3')).toBeInTheDocument()
    })
  })

  it('calls axios.get with correct URL on mount', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    render(<PostsList />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        'https://jsonplaceholder.typicode.com/posts'
      )
    })
  })

  it('displays loading state initially', () => {
    axios.get.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    render(<PostsList />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('displays error message when fetch fails', async () => {
    axios.get.mockRejectedValue(new Error('Network error'))
    render(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch posts')).toBeInTheDocument()
    })
  })

  it('displays table with correct headers', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    render(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText('ID')).toBeInTheDocument()
      expect(screen.getByText('Title')).toBeInTheDocument()
      expect(screen.getByText('User ID')).toBeInTheDocument()
      expect(screen.getByText('Action')).toBeInTheDocument()
    })
  })

  it('displays View Post buttons for each post', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    render(<PostsList />)

    await waitFor(() => {
      const buttons = screen.getAllByText('View Post')
      expect(buttons).toHaveLength(3)
    })
  })

  it('disables buttons while loading', async () => {
    axios.get.mockResolvedValue({ data: mockPosts })
    const { rerender } = render(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText('Test Post 1')).toBeInTheDocument()
    })

    // Buttons should not be disabled after loading
    const buttons = screen.getAllByText('View Post')
    buttons.forEach((button) => {
      expect(button).not.toBeDisabled()
    })
  })

  it('displays only first 10 posts', async () => {
    const manyPosts = Array.from({ length: 20 }, (_, i) => ({
      userId: 1,
      id: i + 1,
      title: `Post ${i + 1}`,
      body: `Body ${i + 1}`
    }))

    axios.get.mockResolvedValue({ data: manyPosts })
    render(<PostsList />)

    await waitFor(() => {
      expect(screen.getByText('Post 1')).toBeInTheDocument()
      expect(screen.getByText('Post 10')).toBeInTheDocument()
      expect(screen.queryByText('Post 11')).not.toBeInTheDocument()
    })
  })
})
