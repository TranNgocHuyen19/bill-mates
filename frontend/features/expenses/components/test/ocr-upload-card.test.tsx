import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { OcrUploadCard } from '../ocr-upload-card'

afterEach(() => {
  vi.restoreAllMocks()
})

test('When a receipt image is selected, then its preview and filename are shown', () => {
  const previewUrl = 'blob:receipt-preview'
  const receipt = new File(['receipt'], 'bill-sieu-thi.jpg', { type: 'image/jpeg' })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue(previewUrl)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

  render(<OcrUploadCard file={receipt} onFileChange={vi.fn()} />)

  expect(screen.getByRole('img', { name: 'Ảnh hóa đơn đã chọn' })).toHaveAttribute('src', previewUrl)
  expect(screen.getByText(receipt.name)).toBeVisible()
})
