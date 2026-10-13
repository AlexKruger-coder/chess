import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App component', () => {
  it('рендерит заголовок приложения, статус и доску', () => {
    render(<App />)

    expect(screen.getByText('Шахматы на двоих')).toBeInTheDocument()
    expect(screen.getByText('Игра на одном устройстве')).toBeInTheDocument()
    expect(screen.getByText('Новая игра')).toBeInTheDocument()
    expect(screen.getByText('Белые')).toBeInTheDocument()
    expect(screen.getByText(/История ходов/i)).toBeInTheDocument()
  })
})
