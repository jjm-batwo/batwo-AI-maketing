import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChatInput } from '@/presentation/components/chat/ChatInput'
import { describe, it, expect, vi } from 'vitest'

describe('ChatInput', () => {
  const onSendMock = vi.fn()

  beforeEach(() => {
    onSendMock.mockClear()
  })

  it('renders input and send button', () => {
    render(<ChatInput onSend={onSendMock} />)
    expect(screen.getByTestId('chat-input')).toBeInTheDocument()
    expect(screen.getByTestId('chat-send-button')).toBeInTheDocument()
  })

  it('disables send button when input is empty', () => {
    render(<ChatInput onSend={onSendMock} />)
    const button = screen.getByTestId('chat-send-button')
    expect(button).toBeDisabled()
  })

  it('enables send button when input has text', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Hello')
    const button = screen.getByTestId('chat-send-button')
    expect(button).toBeEnabled()
  })

  it('calls onSend when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Hello')
    const button = screen.getByTestId('chat-send-button')
    await user.click(button)
    expect(onSendMock).toHaveBeenCalledWith('Hello')
  })

  // New Requirements Tests (Expected to fail initially)

  it('shows character counter', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')
    await user.type(input, 'Test')
    // Expect "4/2000" or similar
    expect(screen.getByText(/4\/2000/)).toBeInTheDocument()
  })

  it('blocks input exceeding 2000 characters', async () => {
    const user = userEvent.setup()
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')

    // Create string longer than 2000 chars
    const longText = 'a'.repeat(2001)
    await user.type(input, longText) // Note: userEvent.type might be slow for 2000 chars, consider fireEvent for large inputs in tests

    // Should be truncated or show error
    // Requirement says "Block messages > 2000 chars", so checking value length is capped or button disabled + error
    // Let's assume input is blocked (value capped) or error shown.
    // Given requirements "Block messages > 2000 chars", typically means preventing typing or validation error.
    // "Real-time character counter" suggests we might allow typing but show error/disable send.
    // Let's test for error message or disabled button if > 2000

    // Actually, usually "Block" means can't type more, OR can type but can't send.
    // "Block messages > 2000 chars" in validation usually means can't submit.
    // Let's assume we allow typing but disable send and show error.

    expect(screen.getByText(/2001\/2000/)).toBeInTheDocument() // If we allow typing
    expect(screen.getByTestId('chat-send-button')).toBeDisabled()
    expect(screen.getByRole('alert')).toBeInTheDocument() // Error message
  })

  it('has accessible label', () => {
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')
    expect(input).toHaveAttribute('aria-label', 'Chat input')
  })

  it('has aria-describedby for helper text (counter/error)', () => {
    render(<ChatInput onSend={onSendMock} />)
    const input = screen.getByTestId('chat-input')
    expect(input).toHaveAttribute('aria-describedby')
  })

  it('sets aria-disabled when loading', () => {
    render(<ChatInput onSend={onSendMock} isLoading={true} />)
    const input = screen.getByTestId('chat-input')
    expect(input).toHaveAttribute('aria-disabled', 'true')
  })
})
