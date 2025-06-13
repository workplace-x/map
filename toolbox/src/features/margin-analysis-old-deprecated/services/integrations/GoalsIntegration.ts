export class GoalsIntegration {
  async getGoalsData(): Promise<any> {
    return { goals: [], integration_status: 'active' }
  }
}

export const goalsIntegration = new GoalsIntegration()
export default GoalsIntegration 