import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App component', () => {
  it('рендерит заголовок приложения, статус, часы, доску и навигацию', () => {
    render(<App />)

    expect(screen.getByText('Шахматы на двоих')).toBeInTheDocument()
    expect(screen.getByText('Игра на одном устройстве')).toBeInTheDocument()
    expect(screen.getByText('Новая игра')).toBeInTheDocument()
    expect(screen.getAllByText('Белые').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Контроль времени:')).toBeInTheDocument()
    expect(screen.getByLabelText('В начало')).toBeInTheDocument()
    expect(screen.getByLabelText('Назад')).toBeInTheDocument()
    expect(screen.getByLabelText('Вперёд')).toBeInTheDocument()
    expect(screen.getByLabelText('В конец')).toBeInTheDocument()
    expect(screen.getByText(/История ходов/i)).toBeInTheDocument()
  })
})
