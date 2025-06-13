/**
 * ML Model Manager
 * Handles machine learning model lifecycle and performance tracking
 */

export interface MLModelConfig {
  name: string
  type: 'regression' | 'classification' | 'clustering' | 'time_series'
  version: string
  features: string[]
  target: string
  hyperparameters: Record<string, any>
  performance_metrics: Record<string, number>
  training_data_period: string
  last_trained: Date
  next_retrain: Date
  status: 'active' | 'training' | 'deprecated' | 'testing'
}

export interface MLPrediction {
  prediction_id: string
  model_name: string
  model_version: string
  input_features: Record<string, any>
  prediction: number | string | boolean | Record<string, any>
  confidence_score: number
  prediction_bounds?: {
    lower: number
    upper: number
  }
  explanation?: string[]
  timestamp: Date
  expires_at?: Date
}

export interface ModelPerformance {
  model_name: string
  accuracy: number
  precision?: number
  recall?: number
  f1_score?: number
  rmse?: number
  mae?: number
  predictions_count: number
  correct_predictions: number
  last_evaluated: Date
  confidence_distribution: Record<string, number>
}

export class MLModelManager {
  private models = new Map<string, MLModelConfig>()
  private predictions = new Map<string, MLPrediction>()
  private performance = new Map<string, ModelPerformance>()

  constructor() {
    this.initializeDefaultModels()
  }

  // ===== MODEL MANAGEMENT =====

  async registerModel(config: MLModelConfig): Promise<void> {
    this.models.set(config.name, config)
    
    // Initialize performance tracking
    this.performance.set(config.name, {
      model_name: config.name,
      accuracy: 0,
      predictions_count: 0,
      correct_predictions: 0,
      last_evaluated: new Date(),
      confidence_distribution: {}
    })
  }

  async getModel(name: string): Promise<MLModelConfig | undefined> {
    return this.models.get(name)
  }

  async listModels(status?: MLModelConfig['status']): Promise<MLModelConfig[]> {
    const models = Array.from(this.models.values())
    return status ? models.filter(m => m.status === status) : models
  }

  async updateModelStatus(name: string, status: MLModelConfig['status']): Promise<void> {
    const model = this.models.get(name)
    if (model) {
      model.status = status
      this.models.set(name, model)
    }
  }

  // ===== PREDICTIONS =====

  async predict(
    modelName: string, 
    features: Record<string, any>,
    options?: {
      include_explanation?: boolean
      confidence_threshold?: number
    }
  ): Promise<MLPrediction> {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    if (model.status !== 'active') {
      throw new Error(`Model ${modelName} is not active (status: ${model.status})`)
    }

    // Simulate ML prediction (in production, this would call actual ML service)
    const prediction = this.simulateModelPrediction(model, features)
    
    const predictionResult: MLPrediction = {
      prediction_id: this.generatePredictionId(),
      model_name: modelName,
      model_version: model.version,
      input_features: features,
      prediction: prediction.value,
      confidence_score: prediction.confidence,
      prediction_bounds: prediction.bounds,
      explanation: options?.include_explanation ? prediction.explanation : undefined,
      timestamp: new Date(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }

    // Store prediction for tracking
    this.predictions.set(predictionResult.prediction_id, predictionResult)

    return predictionResult
  }

  async getBatchPredictions(
    modelName: string,
    featuresArray: Record<string, any>[]
  ): Promise<MLPrediction[]> {
    const predictions = await Promise.all(
      featuresArray.map(features => this.predict(modelName, features))
    )
    return predictions
  }

  // ===== PERFORMANCE TRACKING =====

  async updatePredictionOutcome(
    predictionId: string,
    actualOutcome: number | string,
    feedback?: 'helpful' | 'neutral' | 'unhelpful'
  ): Promise<void> {
    const prediction = this.predictions.get(predictionId)
    if (!prediction) {
      throw new Error(`Prediction ${predictionId} not found`)
    }

    // Update model performance
    const perf = this.performance.get(prediction.model_name)
    if (perf) {
      perf.predictions_count++
      
      // Check if prediction was correct (simplified logic)
      const isCorrect = this.evaluatePredictionAccuracy(prediction.prediction, actualOutcome)
      if (isCorrect) {
        perf.correct_predictions++
      }
      
      perf.accuracy = perf.correct_predictions / perf.predictions_count
      perf.last_evaluated = new Date()
      
      // Update confidence distribution
      const confidenceBucket = Math.floor(prediction.confidence_score * 10) / 10
      perf.confidence_distribution[confidenceBucket] = 
        (perf.confidence_distribution[confidenceBucket] || 0) + 1

      this.performance.set(prediction.model_name, perf)
    }
  }

  async getModelPerformance(modelName: string): Promise<ModelPerformance | undefined> {
    return this.performance.get(modelName)
  }

  async getAllPerformance(): Promise<ModelPerformance[]> {
    return Array.from(this.performance.values())
  }

  // ===== MODEL TRAINING =====

  async trainModel(
    modelName: string,
    trainingData: Record<string, any>[],
    hyperparameters?: Record<string, any>
  ): Promise<{ status: string; metrics: Record<string, number> }> {
    const model = this.models.get(modelName)
    if (!model) {
      throw new Error(`Model ${modelName} not found`)
    }

    // Update model status
    model.status = 'training'
    this.models.set(modelName, model)

    // Simulate training process
    await this.sleep(2000) // Simulate training time

    // Update model with new parameters
    model.hyperparameters = { ...model.hyperparameters, ...hyperparameters }
    model.last_trained = new Date()
    model.next_retrain = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    model.status = 'active'
    
    // Simulate performance metrics
    const metrics = {
      accuracy: 0.85 + Math.random() * 0.1,
      precision: 0.83 + Math.random() * 0.1,
      recall: 0.82 + Math.random() * 0.1,
      f1_score: 0.84 + Math.random() * 0.1
    }
    
    model.performance_metrics = metrics
    this.models.set(modelName, model)

    return { status: 'completed', metrics }
  }

  // ===== MARGIN-SPECIFIC MODELS =====

  async predictMargin(features: {
    customer_id?: string
    vendor_id?: string
    product_category?: string
    order_value?: number
    historical_margin?: number
    season?: string
    region?: string
  }): Promise<MLPrediction> {
    return this.predict('margin_predictor', features, {
      include_explanation: true,
      confidence_threshold: 0.7
    })
  }

  async detectMarginAnomaly(features: {
    current_margin: number
    expected_margin: number
    customer_type: string
    vendor_type: string
    order_characteristics: Record<string, any>
  }): Promise<MLPrediction> {
    return this.predict('anomaly_detector', features)
  }

  async optimizeMargin(features: {
    current_setup: Record<string, any>
    constraints: Record<string, any>
    objectives: string[]
  }): Promise<MLPrediction> {
    return this.predict('margin_optimizer', features, {
      include_explanation: true
    })
  }

  // ===== PRIVATE METHODS =====

  private initializeDefaultModels(): void {
    // Margin Prediction Model
    this.registerModel({
      name: 'margin_predictor',
      type: 'regression',
      version: '1.0.0',
      features: ['customer_type', 'vendor_type', 'order_value', 'historical_margin', 'season'],
      target: 'margin_percentage',
      hyperparameters: { learning_rate: 0.01, max_depth: 10, n_estimators: 100 },
      performance_metrics: { accuracy: 0.87, rmse: 2.3, mae: 1.8 },
      training_data_period: 'last_2_years',
      last_trained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      next_retrain: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
      status: 'active'
    })

    // Anomaly Detection Model
    this.registerModel({
      name: 'anomaly_detector',
      type: 'classification',
      version: '1.1.0',
      features: ['margin_variance', 'customer_risk_score', 'vendor_reliability', 'order_complexity'],
      target: 'is_anomaly',
      hyperparameters: { threshold: 0.05, contamination: 0.1 },
      performance_metrics: { accuracy: 0.92, precision: 0.89, recall: 0.85, f1_score: 0.87 },
      training_data_period: 'last_18_months',
      last_trained: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      next_retrain: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000),
      status: 'active'
    })

    // Margin Optimization Model
    this.registerModel({
      name: 'margin_optimizer',
      type: 'regression',
      version: '1.0.0',
      features: ['current_margin', 'market_conditions', 'competitive_position', 'customer_value'],
      target: 'optimal_margin',
      hyperparameters: { algorithm: 'genetic', population_size: 100, generations: 50 },
      performance_metrics: { accuracy: 0.84, improvement_rate: 0.78 },
      training_data_period: 'last_year',
      last_trained: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      next_retrain: new Date(Date.now() + 16 * 24 * 60 * 60 * 1000),
      status: 'active'
    })
  }

  private simulateModelPrediction(
    model: MLModelConfig, 
    features: Record<string, any>
  ): {
    value: number | string | boolean | Record<string, any>
    confidence: number
    bounds?: { lower: number; upper: number }
    explanation?: string[]
  } {
    // Simulate different prediction types
    switch (model.name) {
      case 'margin_predictor':
        const baseMargin = 15 + Math.random() * 20 // 15-35%
        const confidence = 0.7 + Math.random() * 0.25 // 0.7-0.95
        return {
          value: Math.round(baseMargin * 100) / 100,
          confidence,
          bounds: {
            lower: baseMargin - 2,
            upper: baseMargin + 2
          },
          explanation: [
            'Based on historical customer performance',
            'Vendor relationship strength factored in',
            'Seasonal trends considered'
          ]
        }

      case 'anomaly_detector':
        const isAnomaly = Math.random() < 0.15 // 15% chance of anomaly
        return {
          value: isAnomaly,
          confidence: 0.8 + Math.random() * 0.15,
          explanation: isAnomaly ? [
            'Margin significantly deviates from expected range',
            'Customer behavior pattern changed',
            'Vendor pricing appears unusual'
          ] : undefined
        }

      case 'margin_optimizer':
        const currentMargin = features.current_margin || 15
        const optimizedMargin = currentMargin + Math.random() * 5 // Up to 5% improvement
        return {
          value: {
            recommended_margin: Math.round(optimizedMargin * 100) / 100,
            potential_improvement: Math.round((optimizedMargin - currentMargin) * 100) / 100,
            strategies: ['Negotiate better vendor terms', 'Adjust product mix', 'Optimize pricing']
          },
          confidence: 0.75 + Math.random() * 0.2,
          explanation: [
            'Market analysis suggests room for improvement',
            'Competitive positioning allows for optimization',
            'Customer relationship supports margin enhancement'
          ]
        }

      default:
        return {
          value: Math.random(),
          confidence: 0.5 + Math.random() * 0.4
        }
    }
  }

  private evaluatePredictionAccuracy(predicted: any, actual: any): boolean {
    if (typeof predicted === 'number' && typeof actual === 'number') {
      // For numeric predictions, consider within 10% as correct
      const tolerance = Math.abs(predicted * 0.1)
      return Math.abs(predicted - actual) <= tolerance
    }
    
    if (typeof predicted === 'boolean' && typeof actual === 'boolean') {
      return predicted === actual
    }
    
    return false // Conservative approach for complex types
  }

  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ===== CLEANUP =====

  async cleanup(): Promise<void> {
    // Clean up expired predictions
    const now = Date.now()
    for (const [id, prediction] of this.predictions.entries()) {
      if (prediction.expires_at && new Date(prediction.expires_at).getTime() < now) {
        this.predictions.delete(id)
      }
    }
  }
}

// Singleton instance
export const mlModelManager = new MLModelManager()

export default MLModelManager 