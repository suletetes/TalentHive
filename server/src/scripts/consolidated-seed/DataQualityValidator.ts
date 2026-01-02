import { logger } from '@/utils/logger';
import { ValidationResult, UserData, ProjectData } from './types';

/**
 * Data quality metrics interface
 */
export interface DataQualityMetrics {
  entityType: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  qualityScore: number; // 0-100
  distributionMetrics: DistributionMetrics;
  formatConsistency: FormatConsistencyMetrics;
  completenessMetrics: CompletenessMetrics;
  timestamp: Date;
}

export interface DistributionMetrics {
  expectedDistribution: Record<string, number>;
  actualDistribution: Record<string, number>;
  variance: number;
  isRealistic: boolean;
}

export interface FormatConsistencyMetrics {
  emailFormats: { valid: number; invalid: number };
  phoneFormats: { valid: number; invalid: number };
  dateFormats: { valid: number; invalid: number };
  urlFormats: { valid: number; invalid: number };
  consistencyScore: number; // 0-100
}

export interface CompletenessMetrics {
  requiredFields: { complete: number; incomplete: number };
  optionalFields: { complete: number; incomplete: number };
  completenessScore: number; // 0-100
}

/**
 * Data quality validation report
 */
export interface DataQualityReport {
  overallScore: number;
  entityMetrics: DataQualityMetrics[];
  recommendations: string[];
  criticalIssues: string[];
  warnings: string[];
  generatedAt: Date;
  summary: {
    totalEntities: number;
    passedValidation: number;
    failedValidation: number;
    averageQualityScore: number;
  };
}

/**
 * Comprehensive data quality validation system
 * Ensures consistent data formats and realistic distributions
 */
export class DataQualityValidator {
  private qualityThresholds = {
    minimum: 70,    // Minimum acceptable quality score
    good: 85,       // Good quality threshold
    excellent: 95   // Excellent quality threshold
  };

  /**
   * Validate data quality for all generated entities
   */
  async validateDataQuality(data: Map<string, any[]>): Promise<DataQualityReport> {
    logger.info(' Starting comprehensive data quality validation...');
    
    const entityMetrics: DataQualityMetrics[] = [];
    const criticalIssues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate each entity type
    for (const [entityType, entities] of data.entries()) {
      if (entities.length === 0) {
        warnings.push(`No data found for entity type: ${entityType}`);
        continue;
      }

      const metrics = await this.validateEntityType(entityType, entities);
      entityMetrics.push(metrics);

      // Check for critical issues
      if (metrics.qualityScore < this.qualityThresholds.minimum) {
        criticalIssues.push(`${entityType} quality score (${metrics.qualityScore}) below minimum threshold`);
      }

      // Generate recommendations
      if (metrics.qualityScore < this.qualityThresholds.good) {
        recommendations.push(...this.generateRecommendations(entityType, metrics));
      }
    }

    // Calculate overall metrics
    const totalEntities = entityMetrics.reduce((sum, m) => sum + m.totalRecords, 0);
    const passedValidation = entityMetrics.reduce((sum, m) => sum + m.validRecords, 0);
    const failedValidation = totalEntities - passedValidation;
    const averageQualityScore = entityMetrics.length > 0 
      ? entityMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / entityMetrics.length 
      : 0;

    const overallScore = Math.round(averageQualityScore);

    const report: DataQualityReport = {
      overallScore,
      entityMetrics,
      recommendations,
      criticalIssues,
      warnings,
      generatedAt: new Date(),
      summary: {
        totalEntities,
        passedValidation,
        failedValidation,
        averageQualityScore: Math.round(averageQualityScore * 10) / 10
      }
    };

    logger.info(` Data quality validation complete. Overall score: ${overallScore}/100`);
    
    if (criticalIssues.length > 0) {
      logger.error(` ${criticalIssues.length} critical data quality issues found`);
    }

    return report;
  }

  /**
   * Validate specific entity type
   */
  private async validateEntityType(entityType: string, entities: any[]): Promise<DataQualityMetrics> {
    logger.info(` Validating ${entities.length} ${entityType} entities...`);

    let validRecords = 0;
    let invalidRecords = 0;

    // Validate each entity
    for (const entity of entities) {
      const validation = this.validateEntity(entityType, entity);
      if (validation.isValid) {
        validRecords++;
      } else {
        invalidRecords++;
      }
    }

    // Calculate distribution metrics
    const distributionMetrics = this.calculateDistributionMetrics(entityType, entities);
    
    // Calculate format consistency
    const formatConsistency = this.calculateFormatConsistency(entityType, entities);
    
    // Calculate completeness
    const completenessMetrics = this.calculateCompleteness(entityType, entities);

    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore(
      validRecords,
      entities.length,
      distributionMetrics,
      formatConsistency,
      completenessMetrics
    );

    return {
      entityType,
      totalRecords: entities.length,
      validRecords,
      invalidRecords,
      qualityScore,
      distributionMetrics,
      formatConsistency,
      completenessMetrics,
      timestamp: new Date()
    };
  }

  /**
   * Validate individual entity
   */
  private validateEntity(entityType: string, entity: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (entityType) {
      case 'users':
        return this.validateUser(entity);
      case 'projects':
        return this.validateProject(entity);
      case 'proposals':
        return this.validateProposal(entity);
      case 'contracts':
        return this.validateContract(entity);
      case 'reviews':
        return this.validateReview(entity);
      default:
        return this.validateGenericEntity(entity);
    }
  }

  /**
   * Validate user entity
   */
  private validateUser(user: UserData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Email validation
    if (!user.email || !this.isValidEmail(user.email)) {
      errors.push('Invalid email format');
    }

    // Profile validation
    if (!user.profile?.firstName || !user.profile?.lastName) {
      errors.push('Missing required profile fields');
    }

    if (!user.profile?.slug || !this.isValidSlug(user.profile.slug)) {
      errors.push('Invalid slug format');
    }

    // Role-specific validation
    if (user.role === 'freelancer') {
      if (!user.freelancerProfile) {
        errors.push('Missing freelancer profile');
      } else {
        if (!user.freelancerProfile.skills || user.freelancerProfile.skills.length === 0) {
          errors.push('Freelancer must have skills');
        }
        if (!user.freelancerProfile.hourlyRate || user.freelancerProfile.hourlyRate < 10) {
          warnings.push('Hourly rate seems low');
        }
      }
    }

    // Bio length validation
    if (user.profile?.bio && user.profile.bio.length < 20) {
      warnings.push('Bio is very short');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate project entity
   */
  private validateProject(project: ProjectData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!project.title || project.title.length < 5) {
      errors.push('Project title too short');
    }

    if (!project.description || project.description.length < 50) {
      errors.push('Project description too short');
    }

    // Budget validation
    if (!project.budget || project.budget.min <= 0 || project.budget.max <= project.budget.min) {
      errors.push('Invalid budget range');
    }

    // Timeline validation
    if (!project.timeline || project.timeline.duration <= 0) {
      errors.push('Invalid timeline');
    }

    // Skills validation
    if (!project.skills || project.skills.length === 0) {
      warnings.push('Project has no required skills');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate proposal entity
   */
  private validateProposal(proposal: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!proposal.coverLetter || proposal.coverLetter.length < 50) {
      errors.push('Cover letter too short');
    }

    if (!proposal.bidAmount || proposal.bidAmount <= 0) {
      errors.push('Invalid bid amount');
    }

    if (!proposal.milestones || proposal.milestones.length === 0) {
      warnings.push('No milestones defined');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate contract entity
   */
  private validateContract(contract: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!contract.startDate) {
      errors.push('Missing start date');
    }

    if (!contract.totalAmount || contract.totalAmount <= 0) {
      errors.push('Invalid total amount');
    }

    if (!contract.terms || contract.terms.length < 100) {
      warnings.push('Contract terms seem incomplete');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate review entity
   */
  private validateReview(review: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!review.rating || review.rating < 1 || review.rating > 5) {
      errors.push('Invalid rating');
    }

    if (!review.comment || review.comment.length < 20) {
      errors.push('Review comment too short');
    }

    if (!review.title || review.title.length < 5) {
      warnings.push('Review title very short');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate generic entity
   */
  private validateGenericEntity(entity: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!entity || typeof entity !== 'object') {
      errors.push('Invalid entity structure');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate distribution metrics
   */
  private calculateDistributionMetrics(entityType: string, entities: any[]): DistributionMetrics {
    const expectedDistribution = this.getExpectedDistribution(entityType);
    const actualDistribution = this.calculateActualDistribution(entityType, entities);
    
    // Calculate variance between expected and actual
    let totalVariance = 0;
    let comparisonCount = 0;

    for (const key in expectedDistribution) {
      if (actualDistribution[key] !== undefined) {
        const variance = Math.abs(expectedDistribution[key] - actualDistribution[key]);
        totalVariance += variance;
        comparisonCount++;
      }
    }

    const averageVariance = comparisonCount > 0 ? totalVariance / comparisonCount : 0;
    const isRealistic = averageVariance < 0.15; // Within 15% variance is considered realistic

    return {
      expectedDistribution,
      actualDistribution,
      variance: Math.round(averageVariance * 100) / 100,
      isRealistic
    };
  }

  /**
   * Get expected distribution for entity type
   */
  private getExpectedDistribution(entityType: string): Record<string, number> {
    const distributions = {
      users: {
        freelancers: 0.65,  // 65% freelancers
        clients: 0.32,      // 32% clients  
        admins: 0.03        // 3% admins
      },
      projects: {
        open: 0.25,         // 25% open
        inProgress: 0.20,   // 20% in progress
        completed: 0.40,    // 40% completed
        cancelled: 0.10,    // 10% cancelled
        draft: 0.05         // 5% draft
      },
      proposals: {
        submitted: 0.60,    // 60% submitted
        accepted: 0.15,     // 15% accepted
        rejected: 0.20,     // 20% rejected
        withdrawn: 0.05     // 5% withdrawn
      }
    };

    return distributions[entityType as keyof typeof distributions] || {};
  }

  /**
   * Calculate actual distribution
   */
  private calculateActualDistribution(entityType: string, entities: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    const total = entities.length;

    if (total === 0) return distribution;

    switch (entityType) {
      case 'users':
        const roleCounts = entities.reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {});
        
        for (const role in roleCounts) {
          distribution[role + 's'] = roleCounts[role] / total;
        }
        break;

      case 'projects':
        const statusCounts = entities.reduce((acc, project) => {
          acc[project.status] = (acc[project.status] || 0) + 1;
          return acc;
        }, {});
        
        for (const status in statusCounts) {
          distribution[status] = statusCounts[status] / total;
        }
        break;

      case 'proposals':
        const proposalStatusCounts = entities.reduce((acc, proposal) => {
          acc[proposal.status] = (acc[proposal.status] || 0) + 1;
          return acc;
        }, {});
        
        for (const status in proposalStatusCounts) {
          distribution[status] = proposalStatusCounts[status] / total;
        }
        break;
    }

    return distribution;
  }

  /**
   * Calculate format consistency metrics
   */
  private calculateFormatConsistency(entityType: string, entities: any[]): FormatConsistencyMetrics {
    let emailValid = 0, emailInvalid = 0;
    let phoneValid = 0, phoneInvalid = 0;
    let dateValid = 0, dateInvalid = 0;
    let urlValid = 0, urlInvalid = 0;

    for (const entity of entities) {
      // Email validation
      if (entity.email) {
        if (this.isValidEmail(entity.email)) {
          emailValid++;
        } else {
          emailInvalid++;
        }
      }

      // Phone validation (if present)
      if (entity.phone) {
        if (this.isValidPhone(entity.phone)) {
          phoneValid++;
        } else {
          phoneInvalid++;
        }
      }

      // Date validation
      this.validateDatesInEntity(entity, (isValid) => {
        if (isValid) dateValid++; else dateInvalid++;
      });

      // URL validation
      if (entity.website || entity.profile?.website) {
        const url = entity.website || entity.profile?.website;
        if (this.isValidUrl(url)) {
          urlValid++;
        } else {
          urlInvalid++;
        }
      }
    }

    const totalChecks = emailValid + emailInvalid + phoneValid + phoneInvalid + 
                       dateValid + dateInvalid + urlValid + urlInvalid;
    const validChecks = emailValid + phoneValid + dateValid + urlValid;
    
    const consistencyScore = totalChecks > 0 ? Math.round((validChecks / totalChecks) * 100) : 100;

    return {
      emailFormats: { valid: emailValid, invalid: emailInvalid },
      phoneFormats: { valid: phoneValid, invalid: phoneInvalid },
      dateFormats: { valid: dateValid, invalid: dateInvalid },
      urlFormats: { valid: urlValid, invalid: urlInvalid },
      consistencyScore
    };
  }

  /**
   * Calculate completeness metrics
   */
  private calculateCompleteness(entityType: string, entities: any[]): CompletenessMetrics {
    const requiredFields = this.getRequiredFields(entityType);
    const optionalFields = this.getOptionalFields(entityType);

    let requiredComplete = 0, requiredIncomplete = 0;
    let optionalComplete = 0, optionalIncomplete = 0;

    for (const entity of entities) {
      // Check required fields
      for (const field of requiredFields) {
        if (this.hasCompleteField(entity, field)) {
          requiredComplete++;
        } else {
          requiredIncomplete++;
        }
      }

      // Check optional fields
      for (const field of optionalFields) {
        if (this.hasCompleteField(entity, field)) {
          optionalComplete++;
        } else {
          optionalIncomplete++;
        }
      }
    }

    const totalRequired = requiredComplete + requiredIncomplete;
    const totalOptional = optionalComplete + optionalIncomplete;
    
    const completenessScore = totalRequired > 0 
      ? Math.round((requiredComplete / totalRequired) * 100) 
      : 100;

    return {
      requiredFields: { complete: requiredComplete, incomplete: requiredIncomplete },
      optionalFields: { complete: optionalComplete, incomplete: optionalIncomplete },
      completenessScore
    };
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(
    validRecords: number,
    totalRecords: number,
    distribution: DistributionMetrics,
    formatConsistency: FormatConsistencyMetrics,
    completeness: CompletenessMetrics
  ): number {
    const validityScore = (validRecords / totalRecords) * 100;
    const distributionScore = distribution.isRealistic ? 100 : 60;
    const formatScore = formatConsistency.consistencyScore;
    const completenessScore = completeness.completenessScore;

    // Weighted average
    const weights = {
      validity: 0.4,      // 40% - most important
      format: 0.25,       // 25%
      completeness: 0.25, // 25%
      distribution: 0.1   // 10%
    };

    const weightedScore = 
      validityScore * weights.validity +
      formatScore * weights.format +
      completenessScore * weights.completeness +
      distributionScore * weights.distribution;

    return Math.round(weightedScore);
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(entityType: string, metrics: DataQualityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.qualityScore < this.qualityThresholds.minimum) {
      recommendations.push(`${entityType}: Critical quality issues require immediate attention`);
    }

    if (metrics.formatConsistency.consistencyScore < 80) {
      recommendations.push(`${entityType}: Improve data format consistency, especially email and URL formats`);
    }

    if (metrics.completenessMetrics.completenessScore < 90) {
      recommendations.push(`${entityType}: Ensure all required fields are properly populated`);
    }

    if (!metrics.distributionMetrics.isRealistic) {
      recommendations.push(`${entityType}: Adjust data distribution to match realistic patterns`);
    }

    if (metrics.invalidRecords > metrics.totalRecords * 0.1) {
      recommendations.push(`${entityType}: High number of invalid records (${metrics.invalidRecords}), review validation rules`);
    }

    return recommendations;
  }

  // Validation helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidSlug(slug: string): boolean {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50;
  }

  private validateDatesInEntity(entity: any, callback: (isValid: boolean) => void): void {
    const dateFields = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'completedAt'];
    
    for (const field of dateFields) {
      if (entity[field]) {
        const isValid = entity[field] instanceof Date && !isNaN(entity[field].getTime());
        callback(isValid);
      }
    }
  }

  private hasCompleteField(entity: any, fieldPath: string): boolean {
    const parts = fieldPath.split('.');
    let current = entity;
    
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null || current[part] === '') {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }

  private getRequiredFields(entityType: string): string[] {
    const requiredFields = {
      users: ['email', 'password', 'role', 'profile.firstName', 'profile.lastName', 'profile.slug'],
      projects: ['title', 'description', 'budget', 'timeline', 'client', 'status'],
      proposals: ['project', 'freelancer', 'coverLetter', 'bidAmount', 'status'],
      contracts: ['proposal', 'client', 'freelancer', 'startDate', 'totalAmount'],
      reviews: ['contract', 'reviewer', 'reviewee', 'rating', 'comment']
    };

    return requiredFields[entityType as keyof typeof requiredFields] || [];
  }

  private getOptionalFields(entityType: string): string[] {
    const optionalFields = {
      users: ['profile.bio', 'profile.website', 'profile.avatar', 'freelancerProfile'],
      projects: ['requirements', 'specialRequirements', 'industryType'],
      proposals: ['milestones'],
      contracts: ['endDate', 'terms'],
      reviews: ['title']
    };

    return optionalFields[entityType as keyof typeof optionalFields] || [];
  }

  /**
   * Export quality report to JSON
   */
  exportReport(report: DataQualityReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Get quality threshold recommendations
   */
  getQualityThresholds(): typeof this.qualityThresholds {
    return { ...this.qualityThresholds };
  }

  /**
   * Update quality thresholds
   */
  updateQualityThresholds(thresholds: Partial<typeof this.qualityThresholds>): void {
    this.qualityThresholds = { ...this.qualityThresholds, ...thresholds };
    logger.info(' Quality thresholds updated');
  }
}