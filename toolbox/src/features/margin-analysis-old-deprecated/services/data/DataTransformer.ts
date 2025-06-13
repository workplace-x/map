export class DataTransformer {
  async transformMarginData(data: any[]): Promise<any[]> {
    return data.map(item => ({ ...item, transformed: true }))
  }
}

export const dataTransformer = new DataTransformer()
export default DataTransformer 