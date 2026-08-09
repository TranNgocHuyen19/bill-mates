import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ReceiptImageGallery } from '../receipt-image-gallery'
import { buildCompletedReceipt } from './factories'

vi.mock('../../api', () => ({
  getExpenseReceiptImageApi: vi.fn().mockResolvedValue(new Blob(['receipt'], { type: 'image/jpeg' }))
}))

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => `blob:${(blob as Blob).size}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('When multiple OCR images are available, then the original image can be switched', async () => {
  const firstReceipt = buildCompletedReceipt()
  const secondReceipt = buildCompletedReceipt({
    id: '00000000-0000-0000-0000-000000000103',
    filename: 'bill-bottom.jpg'
  })
  const user = userEvent.setup()
  render(<ReceiptImageGallery receipts={[firstReceipt, secondReceipt]} />)

  await screen.findByRole('img', { name: 'Ảnh bill gốc 1' })
  await user.click(screen.getByRole('button', { name: 'Xem ảnh bill tiếp theo' }))

  expect(await screen.findByRole('img', { name: 'Ảnh bill gốc 2' })).toBeVisible()
  expect(screen.getByText(/bill-bottom\.jpg/)).toBeVisible()
})
