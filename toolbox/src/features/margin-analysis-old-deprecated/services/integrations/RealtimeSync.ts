export class RealtimeSync {
  async startSync(): Promise<void> {
    console.log('Real-time sync started')
  }
}

export const realtimeSync = new RealtimeSync()
export default RealtimeSync 