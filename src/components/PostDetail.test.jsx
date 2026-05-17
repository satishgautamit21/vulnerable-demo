import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostDetail from './PostDetail'
import axios from 'axios'

vi.mock('axios')

const mockPost = {
    userId: 1,
    id: 1,
    title: 'Test Post Title',
    body: 'This is a test post body with detailed content'
}

describe('PostDetail Component', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('does not render anything when postId is null', () => {
        render(<PostDetail postId={null} onClose={() => { }} />)

        expect(screen.queryByText('Test Post Title')).not.toBeInTheDocument()
    })

    it('fetches and displays post details when postId is provided', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        render(<PostDetail postId={1} onClose={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText('Test Post Title')).toBeInTheDocument()
            expect(screen.getByText('This is a test post body with detailed content')).toBeInTheDocument()
        })
    })

    it('calls axios.get with correct URL', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        render(<PostDetail postId={1} onClose={() => { }} />)

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                'https://jsonplaceholder.typicode.com/posts/1'
            )
        })
    })

    it('displays loading state initially', () => {
        axios.get.mockImplementation(
            () => new Promise(() => { }) // Never resolves
        )
        render(<PostDetail postId={1} onClose={() => { }} />)

        expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('displays post metadata', async () => {
        axios.get.mockResolvedValue({ data: mockPost })

        render(<PostDetail postId={1} onClose={() => { }} />)

        await waitFor(() => {
            expect(screen.getByText(/^ID:$/)).toBeInTheDocument()
            expect(screen.getByText(/^User ID:$/)).toBeInTheDocument()
        })
    })

    it('renders modal overlay', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        const { container } = render(<PostDetail postId={1} onClose={() => { }} />)

        await waitFor(() => {
            const overlay = container.querySelector('.modal-overlay')
            expect(overlay).toBeInTheDocument()
        })
    })

    it('renders close button', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        render(<PostDetail postId={1} onClose={() => { }} />)

        const closeButton = screen.getByRole('button')
        expect(closeButton).toBeInTheDocument()
        expect(closeButton.textContent).toBe('×')
    })

    it('calls onClose when close button is clicked', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        const onClose = vi.fn()
        render(<PostDetail postId={1} onClose={onClose} />)

        await waitFor(() => {
            expect(screen.getByText('Test Post Title')).toBeInTheDocument()
        })

        const closeButton = screen.getByRole('button')
        await userEvent.click(closeButton)

        expect(onClose).toHaveBeenCalled()
    })

    it('calls onClose when overlay is clicked', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        const onClose = vi.fn()
        const { container } = render(<PostDetail postId={1} onClose={onClose} />)

        await waitFor(() => {
            expect(screen.getByText('Test Post Title')).toBeInTheDocument()
        })

        const overlay = container.querySelector('.modal-overlay')
        await userEvent.click(overlay)

        expect(onClose).toHaveBeenCalled()
    })

    it('does not call onClose when post card is clicked', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        const onClose = vi.fn()
        const { container } = render(<PostDetail postId={1} onClose={onClose} />)

        await waitFor(() => {
            expect(screen.getByText('Test Post Title')).toBeInTheDocument()
        })

        const card = container.querySelector('.post-card')
        await userEvent.click(card)

        expect(onClose).not.toHaveBeenCalled()
    })

    it('fetches new post when postId prop changes', async () => {
        axios.get.mockResolvedValue({ data: mockPost })
        const { rerender } = render(<PostDetail postId={1} onClose={() => { }} />)

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                'https://jsonplaceholder.typicode.com/posts/1'
            )
        })

        const newPost = { ...mockPost, id: 2, title: 'Different Post' }
        axios.get.mockResolvedValue({ data: newPost })

        rerender(<PostDetail postId={2} onClose={() => { }} />)

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(
                'https://jsonplaceholder.typicode.com/posts/2'
            )
        })
    })
})
