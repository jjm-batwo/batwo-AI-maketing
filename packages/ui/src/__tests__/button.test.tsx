import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../components/button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders correctly with default props', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
      expect(button.tagName).toBe('BUTTON');
    });

    it('renders children content correctly', () => {
      render(<Button>Test Content</Button>);

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('renders complex children content', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Label</span>
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Label')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant classes', () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('applies destructive variant classes', () => {
      render(<Button variant="destructive">Destructive</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
    });

    it('applies outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border', 'border-input', 'bg-background');
    });

    it('applies secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-secondary', 'text-secondary-foreground');
    });

    it('applies ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('applies link variant classes', () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('text-primary', 'underline-offset-4');
    });

    it('applies success variant classes', () => {
      render(<Button variant="success">Success</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-success', 'text-success-foreground');
    });

    it('applies warning variant classes', () => {
      render(<Button variant="warning">Warning</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-warning', 'text-warning-foreground');
    });
  });

  describe('Sizes', () => {
    it('applies default size classes', () => {
      render(<Button size="default">Default Size</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('applies sm size classes', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-9', 'px-3', 'rounded-md');
    });

    it('applies lg size classes', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-11', 'px-8', 'rounded-md');
    });

    it('applies icon size classes', () => {
      render(<Button size="icon">🔍</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('asChild prop', () => {
    it('renders as Slot when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('preserves button classes when rendered as Slot', () => {
      render(
        <Button asChild variant="destructive" size="lg">
          <a href="/test">Styled Link</a>
        </Button>
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('bg-destructive', 'h-11', 'px-8');
    });
  });

  describe('Disabled state', () => {
    it('applies disabled styles when disabled', () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });

    it('does not trigger onClick when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Event handlers', () => {
    it('fires onClick handler when clicked', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('passes event object to onClick handler', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Clickable</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      expect(handleClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it('supports multiple clicks', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Multi-click</Button>);
      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('className prop', () => {
    it('accepts and applies custom className', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with variant classes', () => {
      render(
        <Button variant="destructive" className="custom-class">
          Merged Classes
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('custom-class');
    });

    it('merges custom className with size classes', () => {
      render(
        <Button size="lg" className="my-custom-spacing">
          Sized
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('h-11', 'px-8');
      expect(button).toHaveClass('my-custom-spacing');
    });

    it('handles multiple custom classes', () => {
      render(
        <Button className="class-one class-two class-three">
          Multiple
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('class-one', 'class-two', 'class-three');
    });
  });

  describe('Ref forwarding', () => {
    it('forwards ref to button element', () => {
      const ref = { current: null };

      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toHaveTextContent('Ref Button');
    });

    it('allows ref methods to be called', () => {
      const ref = { current: null as HTMLButtonElement | null };

      render(<Button ref={ref}>Focus Test</Button>);

      ref.current?.focus();
      expect(ref.current).toHaveFocus();
    });

    it('forwards ref when using asChild', () => {
      const ref = { current: null };

      render(
        <Button asChild ref={ref}>
          <a href="/test">Link with Ref</a>
        </Button>
      );

      expect(ref.current).toBeInstanceOf(HTMLAnchorElement);
    });
  });

  describe('HTML attributes', () => {
    it('accepts standard button attributes', () => {
      render(
        <Button type="submit" name="submit-btn" value="submit">
          Submit
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
      expect(button).toHaveAttribute('value', 'submit');
    });

    it('accepts aria attributes', () => {
      render(
        <Button aria-label="Close dialog" aria-pressed="true">
          X
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-label', 'Close dialog');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('accepts data attributes', () => {
      render(<Button data-testid="custom-button" data-action="submit">Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('data-testid', 'custom-button');
      expect(button).toHaveAttribute('data-action', 'submit');
    });
  });

  describe('Combined props', () => {
    it('combines variant, size, and className correctly', () => {
      render(
        <Button variant="success" size="sm" className="extra-class">
          Combined
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('bg-success', 'h-9', 'px-3', 'extra-class');
    });

    it('combines all props including disabled and onClick', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(
        <Button
          variant="outline"
          size="lg"
          onClick={handleClick}
          className="custom"
          disabled={false}
        >
          Full Props
        </Button>
      );
      const button = screen.getByRole('button');

      expect(button).toHaveClass('border', 'h-11', 'custom');
      expect(button).not.toBeDisabled();

      await user.click(button);
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible</Button>);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('includes focus-visible styles', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-2');
      expect(button).toHaveClass('focus-visible:ring-ring');
    });

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Keyboard</Button>);
      const button = screen.getByRole('button');

      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });
  });
});
