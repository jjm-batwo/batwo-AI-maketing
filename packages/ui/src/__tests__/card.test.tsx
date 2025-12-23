import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/card';

describe('Card', () => {
  it('Card renders with children', () => {
    render(
      <Card data-testid="card">
        <div>Card content</div>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm');
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('CardHeader renders correctly', () => {
    render(
      <CardHeader data-testid="card-header">
        <div>Header content</div>
      </CardHeader>
    );

    const header = screen.getByTestId('card-header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('CardTitle renders heading', () => {
    render(<CardTitle data-testid="card-title">Card Title Text</CardTitle>);

    const title = screen.getByTestId('card-title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    expect(screen.getByText('Card Title Text')).toBeInTheDocument();
  });

  it('CardDescription renders description text', () => {
    render(<CardDescription data-testid="card-description">Card description text</CardDescription>);

    const description = screen.getByTestId('card-description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
    expect(screen.getByText('Card description text')).toBeInTheDocument();
  });

  it('CardContent renders main content', () => {
    render(
      <CardContent data-testid="card-content">
        <p>Main content area</p>
      </CardContent>
    );

    const content = screen.getByTestId('card-content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
    expect(screen.getByText('Main content area')).toBeInTheDocument();
  });

  it('CardFooter renders at bottom', () => {
    render(
      <CardFooter data-testid="card-footer">
        <button>Action</button>
      </CardFooter>
    );

    const footer = screen.getByTestId('card-footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('full composition works together', () => {
    render(
      <Card data-testid="complete-card">
        <CardHeader>
          <CardTitle>Complete Card Title</CardTitle>
          <CardDescription>This is a complete card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card</p>
        </CardContent>
        <CardFooter>
          <button>Submit</button>
          <button>Cancel</button>
        </CardFooter>
      </Card>
    );

    // Verify all parts are present
    expect(screen.getByTestId('complete-card')).toBeInTheDocument();
    expect(screen.getByText('Complete Card Title')).toBeInTheDocument();
    expect(screen.getByText('This is a complete card description')).toBeInTheDocument();
    expect(screen.getByText('This is the main content of the card')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    // Verify structure
    const card = screen.getByTestId('complete-card');
    const title = screen.getByText('Complete Card Title');
    const description = screen.getByText('This is a complete card description');

    expect(card).toContainElement(title);
    expect(card).toContainElement(description);
  });

  it('custom className merges correctly', () => {
    render(
      <Card data-testid="card" className="custom-card-class bg-blue-500">
        <CardHeader className="custom-header-class">
          <CardTitle className="custom-title-class">Title</CardTitle>
          <CardDescription className="custom-desc-class">Description</CardDescription>
        </CardHeader>
        <CardContent className="custom-content-class">Content</CardContent>
        <CardFooter className="custom-footer-class">Footer</CardFooter>
      </Card>
    );

    // Card
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-card-class', 'bg-blue-500');
    expect(card).toHaveClass('rounded-lg', 'border'); // default classes

    // Header
    const header = screen.getByText('Title').parentElement;
    expect(header).toHaveClass('custom-header-class');
    expect(header).toHaveClass('flex', 'flex-col', 'p-6'); // default classes

    // Title
    const title = screen.getByText('Title');
    expect(title).toHaveClass('custom-title-class');
    expect(title).toHaveClass('text-2xl', 'font-semibold'); // default classes

    // Description
    const description = screen.getByText('Description');
    expect(description).toHaveClass('custom-desc-class');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground'); // default classes

    // Content
    const content = screen.getByText('Content');
    expect(content).toHaveClass('custom-content-class');
    expect(content).toHaveClass('p-6', 'pt-0'); // default classes

    // Footer
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('custom-footer-class');
    expect(footer).toHaveClass('flex', 'items-center', 'p-6'); // default classes
  });

  it('forwards refs correctly', () => {
    const cardRef = createRef<HTMLDivElement>();
    const headerRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descRef = createRef<HTMLParagraphElement>();
    const contentRef = createRef<HTMLDivElement>();
    const footerRef = createRef<HTMLDivElement>();

    render(
      <Card ref={cardRef} data-testid="card">
        <CardHeader ref={headerRef} data-testid="header">
          <CardTitle ref={titleRef} data-testid="title">
            Title
          </CardTitle>
          <CardDescription ref={descRef} data-testid="description">
            Description
          </CardDescription>
        </CardHeader>
        <CardContent ref={contentRef} data-testid="content">
          Content
        </CardContent>
        <CardFooter ref={footerRef} data-testid="footer">
          Footer
        </CardFooter>
      </Card>
    );

    expect(cardRef.current).toBeInstanceOf(HTMLDivElement);
    expect(cardRef.current).toBe(screen.getByTestId('card'));

    expect(headerRef.current).toBeInstanceOf(HTMLDivElement);
    expect(headerRef.current).toBe(screen.getByTestId('header'));

    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(titleRef.current).toBe(screen.getByTestId('title'));

    expect(descRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(descRef.current).toBe(screen.getByTestId('description'));

    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(contentRef.current).toBe(screen.getByTestId('content'));

    expect(footerRef.current).toBeInstanceOf(HTMLDivElement);
    expect(footerRef.current).toBe(screen.getByTestId('footer'));
  });
});
