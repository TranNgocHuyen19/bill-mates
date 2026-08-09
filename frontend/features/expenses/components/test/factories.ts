import type { ExpenseReceipt } from '../../api'

export function buildCompletedReceipt(overrides: Partial<ExpenseReceipt> = {}): ExpenseReceipt {
  return {
    id: '00000000-0000-0000-0000-000000000101',
    expense_id: '00000000-0000-0000-0000-000000000102',
    bucket: 'receipts',
    storage_path: 'rooms/room-id/expenses/expense-id/receipt.jpg',
    filename: 'bill-mini-mart.jpg',
    mime_type: 'image/jpeg',
    size_bytes: 120_000,
    ocr_status: 'completed',
    ocr_data: {
      provider: 'paddleocr',
      model: 'PP-OCRv5',
      language: 'vi',
      merchant: 'Cửa hàng Mini',
      total_amount: 39_000,
      average_confidence: 0.96,
      items: [
        {
          name: 'Coca Cola',
          quantity: 2,
          unit_price: 12_000,
          total_amount: 24_000,
          confidence: 0.95
        }
      ],
      lines: [],
      raw_text: 'Coca Cola 2 x 12.000 24.000\nTỔNG CỘNG 39.000'
    },
    created_at: '2026-08-09T05:00:00Z',
    updated_at: '2026-08-09T05:01:00Z',
    ...overrides
  }
}
