import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../components/input';
import { createRef } from 'react';

describe('Input', () => {
  it('renders with default styling', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');

    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md', 'border');
  });

  it('accepts and displays value', () => {
    render(<Input data-testid="input" value="test value" readOnly />);
    const input = screen.getByTestId<HTMLInputElement>('input');

    expect(input.value).toBe('test value');
  });

  it('handles onChange events', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input data-testid="input" onChange={handleChange} />);
    const input = screen.getByTestId('input');

    await user.type(input, 'hello');

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange).toHaveBeenCalledTimes(5); // once per character
  });

  it('disabled state', () => {
    render(<Input data-testid="input" disabled />);
    const input = screen.getByTestId('input');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('placeholder text', () => {
    render(<Input data-testid="input" placeholder="Enter text here" />);
    const input = screen.getByTestId('input');

    expect(input).toHaveAttribute('placeholder', 'Enter text here');
  });

  it('different input types', () => {
    const { rerender } = render(<Input data-testid="input" type="text" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'text');

    rerender(<Input data-testid="input" type="password" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input data-testid="input" type="email" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input data-testid="input" type="number" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('merges custom className', () => {
    render(<Input data-testid="input" className="custom-class bg-red-500" />);
    const input = screen.getByTestId('input');

    // Should have both default classes and custom classes
    expect(input).toHaveClass('custom-class', 'bg-red-500');
    expect(input).toHaveClass('flex', 'h-10', 'w-full'); // default classes
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();

    render(<Input ref={ref} data-testid="input" />);

    expect(ref.current).toBeInstanceOf(HTMLInputElement);
    expect(ref.current).toBe(screen.getByTestId('input'));
  });
});
