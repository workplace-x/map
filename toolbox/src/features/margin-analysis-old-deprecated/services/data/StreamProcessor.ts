export class StreamProcessor {
  async processStream(data: any[], callback: (chunk: any) => void): Promise<void> {
    for (const item of data) {
      callback(item)
    }
  }
}

export const streamProcessor = new StreamProcessor()
export default StreamProcessor 