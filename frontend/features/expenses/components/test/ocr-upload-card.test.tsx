import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { OcrUploadCard } from '../ocr-upload-card'

beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockImplementation((file) => `blob:${(file as File).name}`)
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

test('When multiple receipt images are selected, then all files are returned for upload', async () => {
  const firstReceipt = new File(['first'], 'bill-top.jpg', { type: 'image/jpeg' })
  const secondReceipt = new File(['second'], 'bill-bottom.jpg', { type: 'image/jpeg' })
  const onFilesChange = vi.fn()
  const user = userEvent.setup()
  render(<OcrUploadCard files={[]} onFilesChange={onFilesChange} />)

  await user.upload(screen.getByLabelText('Chọn nhiều ảnh hóa đơn để quét'), [firstReceipt, secondReceipt])

  expect(onFilesChange).toHaveBeenCalledWith([firstReceipt, secondReceipt])
})

test('When one preview is removed, then the other receipt image remains selected', async () => {
  const firstReceipt = new File(['first'], 'bill-top.jpg', { type: 'image/jpeg' })
  const secondReceipt = new File(['second'], 'bill-bottom.jpg', { type: 'image/jpeg' })
  const onFilesChange = vi.fn()
  const user = userEvent.setup()
  render(<OcrUploadCard files={[firstReceipt, secondReceipt]} onFilesChange={onFilesChange} />)

  await user.click(screen.getByRole('button', { name: 'Xóa ảnh hóa đơn 1' }))

  expect(screen.getAllByRole('img')).toHaveLength(2)
  expect(onFilesChange).toHaveBeenCalledWith([secondReceipt])
})
