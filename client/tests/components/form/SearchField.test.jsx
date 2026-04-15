import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SearchField from '../../../src/components/form/SearchField'

const FRUIT = [
  { id: 1, name: 'Apple' },
  { id: 2, name: 'Banana' },
  { id: 3, name: 'Cherry' },
]

function renderField(overrides = {}) {
  const props = {
    label: 'Search fruit',
    placeholder: 'Type to search...',
    query: '',
    onQueryChange: () => {},
    results: [],
    onSelect: () => {},
    getOptionKey: (item) => item.id,
    renderOption: (item) => <span>{item.name}</span>,
    ...overrides,
  }
  return render(<SearchField {...props} />)
}

function getInput() {
  return screen.getByRole('combobox', { name: 'Search fruit' })
}

describe('SearchField', () => {
  describe('input', () => {
    it('renders a labelled combobox input', () => {
      renderField()
      const input = getInput()
      expect(input).toHaveAttribute('type', 'search')
      expect(input).toHaveAttribute('aria-autocomplete', 'list')
    })

    it('reflects the query prop as the input value', () => {
      renderField({ query: 'app' })
      expect(getInput()).toHaveValue('app')
    })

    it('forwards the placeholder to the input', () => {
      renderField({ placeholder: 'Find a fruit' })
      expect(getInput()).toHaveAttribute('placeholder', 'Find a fruit')
    })

    it('calls onQueryChange with the new string as the user types', async () => {
      const onQueryChange = vi.fn()
      renderField({ onQueryChange })
      await userEvent.type(getInput(), 'a')
      expect(onQueryChange).toHaveBeenCalledWith('a')
    })
  })

  describe('results (listbox)', () => {
    it('does not render a listbox when results is empty', () => {
      renderField({ results: [] })
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    })

    it('marks the combobox as collapsed when results is empty', () => {
      renderField({ results: [] })
      expect(getInput()).toHaveAttribute('aria-expanded', 'false')
    })

    it('marks the combobox as expanded when results are present', () => {
      renderField({ results: FRUIT })
      expect(getInput()).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders a labelled listbox when results are present', () => {
      renderField({ results: FRUIT })
      expect(screen.getByRole('listbox', { name: 'Search fruit results' })).toBeInTheDocument()
    })

    it('uses resultsLabel as the listbox accessible name when provided', () => {
      renderField({ results: FRUIT, resultsLabel: 'Matching fruits' })
      expect(screen.getByRole('listbox', { name: 'Matching fruits' })).toBeInTheDocument()
    })

    it('wires aria-controls from combobox to listbox id when open', () => {
      renderField({ results: FRUIT })
      const controlsId = getInput().getAttribute('aria-controls')
      expect(controlsId).toBeTruthy()
      expect(screen.getByRole('listbox')).toHaveAttribute('id', controlsId)
    })

    it('does not wire aria-controls when the listbox is closed', () => {
      renderField({ results: [] })
      expect(getInput()).not.toHaveAttribute('aria-controls')
    })

    it('renders one <option> per result via renderOption', () => {
      renderField({ results: FRUIT })
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(FRUIT.length)
      expect(screen.getByRole('option', { name: 'Apple' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Cherry' })).toBeInTheDocument()
    })

    it('each option button is type="button" so it does not submit a parent form', () => {
      renderField({ results: FRUIT })
      for (const option of screen.getAllByRole('option')) {
        expect(option).toHaveAttribute('type', 'button')
      }
    })

    it('uses getOptionKey for the React key per option', () => {
      const duplicates = [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Apple' },
      ]
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      renderField({ results: duplicates })
      expect(screen.getAllByRole('option', { name: 'Apple' })).toHaveLength(2)
      expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('unique "key"'))
      errorSpy.mockRestore()
    })
  })

  describe('selection via mouse', () => {
    it('calls onSelect with the clicked item', async () => {
      const onSelect = vi.fn()
      renderField({ results: FRUIT, onSelect })
      await userEvent.click(screen.getByRole('option', { name: 'Banana' }))
      expect(onSelect).toHaveBeenCalledWith(FRUIT[1])
    })
  })

  describe('keyboard navigation', () => {
    it('ArrowDown moves the active option forward (aria-activedescendant)', async () => {
      renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      expect(input).not.toHaveAttribute('aria-activedescendant')

      await userEvent.keyboard('{ArrowDown}')
      const firstId = input.getAttribute('aria-activedescendant')
      expect(firstId).toBeTruthy()
      expect(document.getElementById(firstId)).toHaveAttribute('aria-selected', 'true')

      await userEvent.keyboard('{ArrowDown}')
      const secondId = input.getAttribute('aria-activedescendant')
      expect(secondId).not.toBe(firstId)
    })

    it('ArrowDown wraps from the last option back to the first', async () => {
      renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      // Move past the end.
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}')
      const id = input.getAttribute('aria-activedescendant')
      expect(document.getElementById(id)).toHaveTextContent('Apple')
    })

    it('ArrowUp wraps from the first option to the last', async () => {
      renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{ArrowUp}')
      const id = input.getAttribute('aria-activedescendant')
      expect(document.getElementById(id)).toHaveTextContent('Cherry')
    })

    it('Home jumps to the first option, End jumps to the last', async () => {
      renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{End}')
      expect(document.getElementById(input.getAttribute('aria-activedescendant'))).toHaveTextContent('Cherry')

      await userEvent.keyboard('{Home}')
      expect(document.getElementById(input.getAttribute('aria-activedescendant'))).toHaveTextContent('Apple')
    })

    it('Enter selects the active option', async () => {
      const onSelect = vi.fn()
      renderField({ results: FRUIT, onSelect })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}')
      expect(onSelect).toHaveBeenCalledWith(FRUIT[1])
    })

    it('Enter does nothing when no option is active', async () => {
      const onSelect = vi.fn()
      renderField({ results: FRUIT, onSelect })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{Enter}')
      expect(onSelect).not.toHaveBeenCalled()
    })

    it('Escape clears the active option', async () => {
      renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(input).toHaveAttribute('aria-activedescendant')

      await userEvent.keyboard('{Escape}')
      expect(input).not.toHaveAttribute('aria-activedescendant')
    })

    it('arrow keys are no-ops when results is empty', async () => {
      renderField({ results: [] })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(input).not.toHaveAttribute('aria-activedescendant')
    })
  })

  describe('results change', () => {
    it('resets the active option when results change', async () => {
      const { rerender } = renderField({ results: FRUIT })
      const input = getInput()
      input.focus()
      await userEvent.keyboard('{ArrowDown}')
      expect(input).toHaveAttribute('aria-activedescendant')

      const NEW_RESULTS = [{ id: 99, name: 'Date' }]
      rerender(
        <SearchField
          label="Search fruit"
          placeholder="Type to search..."
          query=""
          onQueryChange={() => {}}
          results={NEW_RESULTS}
          onSelect={() => {}}
          getOptionKey={(item) => item.id}
          renderOption={(item) => <span>{item.name}</span>}
        />,
      )
      expect(input).not.toHaveAttribute('aria-activedescendant')
    })
  })

  describe('className', () => {
    it('merges user className onto the wrapper', () => {
      const { container } = renderField({ className: 'my-wrap' })
      expect(container.firstChild).toHaveClass('my-wrap')
    })
  })
})
