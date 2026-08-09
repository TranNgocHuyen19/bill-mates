import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { OcrReceiptReview } from '../ocr-receipt-review'
import { buildCompletedReceipt } from './factories'

vi.mock('../../api', () => ({
  getExpenseReceiptImageApi: vi.fn().mockResolvedValue(new Blob(['receipt'], { type: 'image/jpeg' }))
}))

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:receipt')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

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

  await screen.findByRole('img', { name: 'Ảnh bill gốc 1' })
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

test('When receipt screenshots overlap, then duplicate items are merged and unique items remain', async () => {
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
        { ...sharedItem, name: 'KHOAI M0' },
        { name: 'Khoai mỡ loại 2', quantity: 1, unit_price: 6_699, total_amount: 6_699, confidence: 0.96 },
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

  await screen.findByRole('img', { name: 'Ảnh bill gốc 1' })
  expect(screen.getByText('PaddleOCR tìm thấy 4 món từ 2 ảnh')).toBeVisible()
  expect(screen.getByText('Đã lọc 1 dòng trùng')).toBeVisible()
  expect(screen.getByDisplayValue('Khoai mỡ loại 2')).toBeVisible()
})

test('When a receipt item has a discount, then original, discount, net, and payable totals are visible', async () => {
  const receipt = buildCompletedReceipt({
    ocr_data: {
      total_amount: 288_500,
      subtotal_amount: 294_844,
      discount_amount: 6_344,
      order_discount_amount: 44,
      items: [
        {
          name: 'MONG TOI BABY 300G',
          quantity: 1,
          unit_price: 31_500,
          original_total_amount: 31_500,
          discount_amount: 6_300,
          discount_percent: 20,
          total_amount: 25_200,
          confidence: 0.99
        },
        {
          name: 'THIT HEO',
          quantity: 1,
          unit_price: 263_344,
          total_amount: 263_344,
          confidence: 0.98
        }
      ]
    }
  })

  render(
    <OcrReceiptReview
      receipts={[receipt]}
      expenseTotal={288_500}
      selectedIndex={null}
      importedIndexes={[]}
      isRetrying={false}
      onRetry={vi.fn()}
      onUseSuggestion={vi.fn()}
    />
  )

  expect(screen.getByText(/Giảm 20%.*6.300.*còn 25.200/)).toBeVisible()
  expect(screen.getByText(/Phân bổ giảm toàn đơn.*44.*còn 263.300/)).toBeVisible()
  expect(screen.getByText(/VAT trên bill chỉ để kê khai, không cộng thêm/)).toBeVisible()
})
