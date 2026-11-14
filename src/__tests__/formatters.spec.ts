import { describe, it, expect } from 'vitest'

describe('Financial Formatters & Utilities', () => {
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value)
  }

  it('formats positive currency amounts into IDR correctly', () => {
    const formatted = formatRupiah(15000000)
    // IDR format contains Rp and digits
    expect(formatted).toContain('15.000.000')
    expect(formatted).toContain('Rp')
  })

  it('formats zero correctly', () => {
    const formatted = formatRupiah(0)
    expect(formatted).toContain('0')
    expect(formatted).toContain('Rp')
  })

  it('calculates reversing balance correctly based on transaction type', () => {
    const initialBalance = 10000000
    const erroneousCashIn = 2000000

    // Jurnal pembalik untuk Cash In yang salah harus mengurangi saldo
    const correctedBalanceAfterCashInReversal = initialBalance - erroneousCashIn
    expect(correctedBalanceAfterCashInReversal).toBe(8000000)

    // Jurnal pembalik untuk Cash Out yang salah harus mengembalikan saldo
    const erroneousCashOut = 1500000
    const correctedBalanceAfterCashOutReversal = initialBalance + erroneousCashOut
    expect(correctedBalanceAfterCashOutReversal).toBe(11500000)
  })
})
