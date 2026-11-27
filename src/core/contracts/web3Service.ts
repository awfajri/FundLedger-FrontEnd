import { ethers, BrowserProvider, Contract } from 'ethers'
import FundLedgerABI from './FundLedgerABI.json'

// Address smart contract default (bisa dioverride dari API backend atau input user)
export const DEFAULT_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export interface WalletState {
  isConnected: boolean
  address: string | null
  networkName: string | null
  balanceEth: string | null
}

class Web3Service {
  private contractAddress: string = DEFAULT_CONTRACT_ADDRESS

  setContractAddress(address: string) {
    if (address && address.startsWith('0x') && address.length === 42) {
      this.contractAddress = address
    }
  }

  getContractAddress(): string {
    return this.contractAddress
  }

  // Cek ketersediaan provider MetaMask di browser
  isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && Boolean((window as any).ethereum)
  }

  // Ambil BrowserProvider dari MetaMask
  getProvider(): BrowserProvider | null {
    if (!this.isMetaMaskAvailable()) return null
    return new BrowserProvider((window as any).ethereum)
  }

  // Hubungkan ke dompet MetaMask
  async connectWallet(): Promise<WalletState> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('Ekstensi MetaMask tidak ditemukan di browser Anda. Harap instal MetaMask untuk menghubungkan wallet.')
    }

    const provider = this.getProvider()!
    const accounts = await provider.send('eth_requestAccounts', [])
    const signer = await provider.getSigner()
    const address = await signer.getAddress()
    const network = await provider.getNetwork()
    const balance = await provider.getBalance(address)

    return {
      isConnected: true,
      address,
      networkName: network.name === 'unknown' ? `Chain ID ${network.chainId}` : network.name,
      balanceEth: parseFloat(ethers.formatEther(balance)).toFixed(4),
    }
  }

  // Ambil wallet yang sedang aktif tanpa prompt
  async getCurrentWallet(): Promise<WalletState | null> {
    if (!this.isMetaMaskAvailable()) return null
    try {
      const provider = this.getProvider()!
      const accounts = await provider.send('eth_accounts', [])
      if (!accounts || accounts.length === 0) return null

      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const network = await provider.getNetwork()
      const balance = await provider.getBalance(address)

      return {
        isConnected: true,
        address,
        networkName: network.name === 'unknown' ? `Chain ID ${network.chainId}` : network.name,
        balanceEth: parseFloat(ethers.formatEther(balance)).toFixed(4),
      }
    } catch {
      return null
    }
  }

  // Inisialisasi instance contract FundLedger
  async getContract(needsSigner: boolean = false): Promise<Contract | null> {
    const provider = this.getProvider()
    if (!provider) return null

    if (needsSigner) {
      const signer = await provider.getSigner()
      return new Contract(this.contractAddress, FundLedgerABI, signer)
    }

    return new Contract(this.contractAddress, FundLedgerABI, provider)
  }

  // Panggil recordCashIn di blockchain
  async recordCashInOnChain(txId: string, amount: number, category: string): Promise<string> {
    const contract = await this.getContract(true)
    if (!contract) {
      throw new Error('Dompet Web3 belum terhubung.')
    }

    const tx = await (contract as any).recordCashIn(txId, amount, category)
    const receipt = await tx.wait(1)
    return receipt.hash || tx.hash
  }

  // Panggil requestCashOut di blockchain
  async requestCashOutOnChain(txId: string, amount: number, category: string): Promise<string> {
    const contract = await this.getContract(true)
    if (!contract) {
      throw new Error('Dompet Web3 belum terhubung.')
    }

    const tx = await (contract as any).requestCashOut(txId, amount, category)
    const receipt = await tx.wait(1)
    return receipt.hash || tx.hash
  }

  // Panggil approveCashOut di blockchain
  async approveCashOutOnChain(txId: string): Promise<string> {
    const contract = await this.getContract(true)
    if (!contract) {
      throw new Error('Dompet Web3 belum terhubung.')
    }

    const tx = await (contract as any).approveCashOut(txId)
    const receipt = await tx.wait(1)
    return receipt.hash || tx.hash
  }

  // Panggil rejectCashOut di blockchain
  async rejectCashOutOnChain(txId: string): Promise<string> {
    const contract = await this.getContract(true)
    if (!contract) {
      throw new Error('Dompet Web3 belum terhubung.')
    }

    const tx = await (contract as any).rejectCashOut(txId)
    const receipt = await tx.wait(1)
    return receipt.hash || tx.hash
  }

  // Baca seluruh transaksi langsung dari Smart Contract
  async fetchAllTransactionsFromChain(): Promise<any[]> {
    const contract = await this.getContract(false)
    if (!contract) return []

    try {
      const rawRecords = await (contract as any).getAllTransactions()
      return rawRecords.map((r: any) => ({
        id: r.id,
        amount: Number(r.amount),
        txType: Number(r.txType) === 0 ? 'cash_in' : 'cash_out',
        category: r.category,
        timestamp: Number(r.timestamp),
        maker: r.maker,
        checker: r.checker,
        status: Number(r.status) === 0 ? 'pending' : Number(r.status) === 1 ? 'completed' : 'rejected',
      }))
    } catch (err) {
      console.warn('Gagal membaca transaksi dari Smart Contract:', err)
      return []
    }
  }
}

export const web3Service = new Web3Service()
