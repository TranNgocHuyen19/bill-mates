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
      receipts={[receipt]}
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
      receipts={[receipt]}
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

test('When receipt screenshots overlap, then duplicate items are merged and unique items remain', () => {
  const sharedItem = {
    name: 'Khoai mỡ',
    quantity: 0.406,
    unit_price: 16_500,
    total_amount: 6_699,
    confidence: 0.98
  }
  const firstReceipt = buildCompletedReceipt({
    ocr_data: {
      total_amount: null,
      average_confidence: 0.96,
      items: [
        sharedItem,
        { name: 'Gạo ST25', quantity: 1, unit_price: 139_000, total_amount: 139_000, confidence: 0.97 }
      ]
    }
  })
  const secondReceipt = buildCompletedReceipt({
    id: '00000000-0000-0000-0000-000000000103',
    filename: 'bill-bottom.jpg',
    ocr_data: {
      total_amount: 724_447,
      average_confidence: 0.97,
      items: [
        { ...sharedItem, name: 'KHOAI MO' },
        { name: 'Cà chua', quantity: 0.412, unit_price: 29_400, total_amount: 12_113, confidence: 0.99 }
      ]
    }
  })

  render(
    <OcrReceiptReview
      receipts={[firstReceipt, secondReceipt]}
      expenseTotal={724_447}
      selectedIndex={null}
      importedIndexes={[]}
      isRetrying={false}
      onRetry={vi.fn()}
      onUseSuggestion={vi.fn()}
    />
  )

  expect(screen.getByText('PaddleOCR tìm thấy 3 món từ 2 ảnh')).toBeVisible()
  expect(screen.getByDisplayValue('Cà chua')).toBeVisible()
})
