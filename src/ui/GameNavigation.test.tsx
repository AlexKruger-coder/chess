import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { GameNavigation } from './GameNavigation'

describe('GameNavigation', () => {
  it('отображает текущий шаг и общее количество ходов', () => {
    render(
      <GameNavigation
        currentStep={2}
        totalSteps={4}
        isBrowsing={true}
        onFirst={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onLast={vi.fn()}
        onReturnToLive={vi.fn()}
      />
    )

    expect(screen.getByText('2 / 4')).toBeInTheDocument()
    expect(screen.getByText('Просмотр')).toBeInTheDocument()
    expect(screen.getByText('К текущей позиции')).toBeInTheDocument()
  })

  it('вызывает соответствующие колбэки при клике на кнопки навигации', () => {
    const handleFirst = vi.fn()
    const handlePrevious = vi.fn()
    const handleNext = vi.fn()
    const handleLast = vi.fn()
    const handleReturnToLive = vi.fn()

    render(
      <GameNavigation
        currentStep={2}
        totalSteps={4}
        isBrowsing={true}
        onFirst={handleFirst}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onLast={handleLast}
        onReturnToLive={handleReturnToLive}
      />
    )

    fireEvent.click(screen.getByLabelText('В начало'))
    expect(handleFirst).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Назад'))
    expect(handlePrevious).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('Вперёд'))
    expect(handleNext).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByLabelText('В конец'))
    expect(handleLast).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('К текущей позиции'))
    expect(handleReturnToLive).toHaveBeenCalledTimes(1)
  })

  it('блокирует кнопки назад и в начало на нулевом шаге', () => {
    render(
      <GameNavigation
        currentStep={0}
        totalSteps={4}
        isBrowsing={true}
        onFirst={vi.fn()}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        onLast={vi.fn()}
        onReturnToLive={vi.fn()}
      />
    )

    expect(screen.getByLabelText('В начало')).toBeDisabled()
    expect(screen.getByLabelText('Назад')).toBeDisabled()
    expect(screen.getByLabelText('Вперёд')).not.toBeDisabled()
    expect(screen.getByLabelText('В конец')).not.toBeDisabled()
  })
})
