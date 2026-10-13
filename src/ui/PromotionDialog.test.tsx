import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PromotionDialog } from './PromotionDialog'

describe('PromotionDialog', () => {
  it('отображает выбор фигур и вызывает onSelect при клике', () => {
    const handleSelect = vi.fn()
    const handleCancel = vi.fn()

    render(
      <PromotionDialog
        color="w"
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    )

    expect(screen.getByText('Превращение пешки')).toBeInTheDocument()
    expect(screen.getByText('Ферзь')).toBeInTheDocument()
    expect(screen.getByText('Конь')).toBeInTheDocument()
    expect(screen.getByText('Ладья')).toBeInTheDocument()
    expect(screen.getByText('Слон')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Ферзь'))
    expect(handleSelect).toHaveBeenCalledWith('q')
  })

  it('вызывает onCancel при нажатии кнопки Отмена', () => {
    const handleSelect = vi.fn()
    const handleCancel = vi.fn()

    render(
      <PromotionDialog
        color="b"
        onSelect={handleSelect}
        onCancel={handleCancel}
      />
    )

    fireEvent.click(screen.getByText('Отмена'))
    expect(handleCancel).toHaveBeenCalledTimes(1)
  })
})
