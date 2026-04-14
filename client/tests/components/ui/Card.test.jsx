import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Card, { CardBody, CardFooter, CardHeader } from '../../../src/components/ui/Card'

describe('Card', () => {
  it('renders children inside a bordered container', () => {
    render(<Card>Content</Card>)
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies base classes (bg-card, rounded-lg, border border-mint)', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-card')
    expect(card).toHaveClass('rounded-lg')
    expect(card).toHaveClass('border')
    expect(card).toHaveClass('border-mint')
  })

  it('does NOT bake in a shadow — elevation is a call-site choice', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild
    expect(card.className).not.toContain('shadow-')
  })

  it('merges a user-provided className', () => {
    const { container } = render(<Card className="shadow-md">Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-card')
    expect(card).toHaveClass('shadow-md')
  })

  it('forwards kwargs (data-testid, id, etc.) to the root element', () => {
    render(
      <Card data-testid="my-card" id="login-card">
        Content
      </Card>,
    )
    const card = screen.getByTestId('my-card')
    expect(card).toHaveAttribute('id', 'login-card')
  })
})

describe('CardHeader', () => {
  it('renders children with a bottom border divider', () => {
    const { container } = render(<CardHeader>Title</CardHeader>)
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('border-b')
    expect(container.firstChild).toHaveClass('border-mint')
  })

  it('merges a user-provided className', () => {
    const { container } = render(<CardHeader className="text-center">Title</CardHeader>)
    expect(container.firstChild).toHaveClass('text-center')
  })
})

describe('CardBody', () => {
  it('renders children with body padding', () => {
    const { container } = render(<CardBody>Content</CardBody>)
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('p-6')
  })

  it('merges a user-provided className (e.g. space-y-4 for field stacks)', () => {
    const { container } = render(<CardBody className="space-y-4">Content</CardBody>)
    expect(container.firstChild).toHaveClass('space-y-4')
  })
})

describe('CardFooter', () => {
  it('renders children with a top border divider', () => {
    const { container } = render(<CardFooter>Actions</CardFooter>)
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(container.firstChild).toHaveClass('border-t')
    expect(container.firstChild).toHaveClass('border-mint')
  })
})

describe('Card compound usage', () => {
  it('renders Header + Body + Footer together in order', () => {
    render(
      <Card>
        <CardHeader>Log in</CardHeader>
        <CardBody>Form fields</CardBody>
        <CardFooter>Submit button</CardFooter>
      </Card>,
    )
    expect(screen.getByText('Log in')).toBeInTheDocument()
    expect(screen.getByText('Form fields')).toBeInTheDocument()
    expect(screen.getByText('Submit button')).toBeInTheDocument()
  })

  it('works with only Body (no header or footer)', () => {
    render(
      <Card>
        <CardBody>Just content</CardBody>
      </Card>,
    )
    expect(screen.getByText('Just content')).toBeInTheDocument()
  })
})
