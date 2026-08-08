import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import axios, { AxiosError } from 'axios'

type EntityErrorPayload = {
  message: string
  errors: {
    field: string
    message: string
  }[]
}

type BaseErrorResponse = {
  code?: string | number
  message?: string
  error?: {
    message?: string
  }
  data?: Record<string, unknown> | null
  errors?: Record<string, string> | Array<{ message?: string }> | null
}

const pickFirstMessage = (...values: Array<unknown>): string | undefined => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

const getValidationFieldErrors = (error: AxiosError<BaseErrorResponse>): Array<{ field: string; message: string }> => {
  const payload = error.response?.data

  const errorsObj =
    payload?.errors && typeof payload.errors === 'object' && !Array.isArray(payload.errors)
      ? payload.errors
      : payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
        ? payload.data
        : null

  if (!errorsObj) {
    return []
  }

  if ('message' in errorsObj && Object.keys(errorsObj).length === 1) {
    return []
  }

  return Object.entries(errorsObj)
    .filter(([field, message]) => Boolean(field) && typeof message === 'string' && message.trim().length > 0)
    .map(([field, message]) => ({ field, message: (message as string).trim() }))
}

export class EntityError extends Error {
  status: 422
  payload: EntityErrorPayload

  constructor({ status, payload }: { status: 422; payload: EntityErrorPayload }) {
    super('Entity Error')
    this.status = status
    this.payload = payload
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as BaseErrorResponse | undefined

    let firstArrayErrorMessage: string | undefined
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      firstArrayErrorMessage = data.errors[0]?.message
    } else if (data?.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const values = Object.values(data.errors)
      if (values.length > 0 && typeof values[0] === 'string') {
        firstArrayErrorMessage = values[0]
      }
    }

    const backendMessage = pickFirstMessage(
      data?.message,
      data?.error?.message,
      data?.data?.message,
      firstArrayErrorMessage,
      error.message
    )

    return backendMessage || 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Đã xảy ra lỗi. Vui lòng thử lại sau.'
}

export const handleErrorApi = <T extends FieldValues>({
  error,
  setError
}: {
  error: unknown
  setError?: UseFormSetError<T>
  duration?: number
}) => {
  if (error instanceof EntityError && setError) {
    error.payload.errors.forEach((err) => {
      setError(err.field as Path<T>, {
        type: 'server',
        message: err.message
      })
    })
  } else if (axios.isAxiosError(error)) {
    if (setError) {
      const fieldErrors = getValidationFieldErrors(error)
      if (fieldErrors.length > 0) {
        fieldErrors.forEach((err) => {
          setError(err.field as Path<T>, {
            type: 'server',
            message: err.message
          })
        })
        return
      }
    }
  }
}

export const getErrorCode = (error: unknown): string | undefined => {
  if (axios.isAxiosError(error)) {
    const code = (error.response?.data as BaseErrorResponse)?.code
    return code?.toString()
  }
  return undefined
}

export const isAxiosError = (error: unknown): error is AxiosError<BaseErrorResponse> => {
  return axios.isAxiosError(error)
}
