import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { OcrReceiptReview } from '../ocr-receipt-review'
import { buildCompletedReceipt } from './factories'

test('When editing an OCR suggestion, then the reviewed item is selected for splitting', async () => {
  const receipt = buildCompletedReceipt()
  const onUseSuggestion = vi.fn()
  const user = userEvent.setup()
  render(
    <OcrReceiptReview
      receipt={receipt}
      expenseTotal={39_000}
      selectedIndex={null}
      importedIndexes={[]}
      isRetrying={false}
      onRetry={vi.fn()}
      onUseSuggestion={onUseSuggestion}
    />
  )

  await user.clear(screen.getByLabelText('Tên món OCR 1'))
  await user.type(screen.getByLabelText('Tên món OCR 1'), 'Coca không đường')
  await user.clear(screen.getByLabelText('Thành tiền món OCR 1'))
  await user.type(screen.getByLabelText('Thành tiền món OCR 1'), '42000')
  await user.click(screen.getByRole('button', { name: 'Chia món này' }))

  expect(onUseSuggestion).toHaveBeenCalledWith({
    name: 'Coca không đường',
    quantity: 2,
    unit_price: 12_000,
    total_amount: 42_000,
    confidence: 0.95,
    sourceIndex: 0
  })
})

test('When OCR failed, then an actionable error and retry are available', async () => {
  const failureMessage = 'Không nhận diện được chữ trên ảnh.'
  const receipt = buildCompletedReceipt({
    ocr_status: 'failed',
    ocr_data: { error: { message: failureMessage } }
  })
  const onRetry = vi.fn()
  const user = userEvent.setup()
  render(
    <OcrReceiptReview
      receipt={receipt}
      expenseTotal={39_000}
      selectedIndex={null}
      importedIndexes={[]}
      isRetrying={false}
      onRetry={onRetry}
      onUseSuggestion={vi.fn()}
    />
  )

  await user.click(screen.getByRole('button', { name: 'Quét lại bill' }))

  expect(screen.getByRole('alert')).toHaveTextContent(failureMessage)
  expect(onRetry).toHaveBeenCalledOnce()
})
