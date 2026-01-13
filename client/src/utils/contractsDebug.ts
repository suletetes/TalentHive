/**
 * Contracts Debug Utility
 * This utility helps debug the contracts page data flow
 */

export class ContractsDebugger {
  private static instance: ContractsDebugger;
  private logs: Array<{ timestamp: string; level: string; message: string; data?: any }> = [];

  static getInstance(): ContractsDebugger {
    if (!ContractsDebugger.instance) {
      ContractsDebugger.instance = new ContractsDebugger();
    }
    return ContractsDebugger.instance;
  }

  private log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    this.logs.push(logEntry);
    
    // Also log to console with styling
    const style = this.getLogStyle(level);
    console.log(`%c[CONTRACTS DEBUG ${level}] ${message}`, style, data || '');
  }

  private getLogStyle(level: string): string {
    switch (level) {
      case 'ERROR': return 'color: #ff4444; font-weight: bold;';
      case 'WARN': return 'color: #ffaa00; font-weight: bold;';
      case 'INFO': return 'color: #0088ff; font-weight: bold;';
      case 'SUCCESS': return 'color: #00aa00; font-weight: bold;';
      default: return 'color: #666666;';
    }
  }

  // Page lifecycle logging
  logPageMount() {
    this.log('INFO', 'ContractsPage component mounted');
  }

  logPageUnmount() {
    this.log('INFO', 'ContractsPage component unmounted');
  }

  // API call logging
  logApiCallStart(endpoint: string, params?: any) {
    this.log('INFO', `Starting API call to ${endpoint}`, params);
  }

  logApiCallSuccess(endpoint: string, response: any) {
    this.log('SUCCESS', `API call to ${endpoint} successful`, {
      responseType: typeof response,
      hasData: !!response?.data,
      dataType: typeof response?.data,
      dataLength: Array.isArray(response?.data) ? response.data.length : 'not array',
      responseKeys: Object.keys(response || {}),
      dataKeys: response?.data ? Object.keys(response.data) : 'no data'
    });
  }

  logApiCallError(endpoint: string, error: any) {
    this.log('ERROR', `API call to ${endpoint} failed`, {
      errorMessage: error?.message,
      errorStatus: error?.response?.status,
      errorData: error?.response?.data,
      fullError: error
    });
  }

  // Data extraction logging
  logDataExtractionStart(response: any) {
    this.log('INFO', 'Starting data extraction from API response', {
      responseType: typeof response,
      responseKeys: Object.keys(response || {}),
      hasData: !!response?.data,
      dataType: typeof response?.data,
      isDataArray: Array.isArray(response?.data)
    });
  }

  logDataExtractionResult(extractedData: any) {
    this.log('INFO', 'Data extraction completed', {
      extractedType: typeof extractedData,
      isArray: Array.isArray(extractedData),
      length: Array.isArray(extractedData) ? extractedData.length : 'not array',
      sampleData: Array.isArray(extractedData) && extractedData.length > 0 ? extractedData[0] : extractedData
    });
  }

  // Authentication logging
  logAuthCheck(user: any, token: string | null) {
    this.log('INFO', 'Checking authentication for contracts', {
      hasUser: !!user,
      userRole: user?.role,
      userId: user?._id,
      hasToken: !!token,
      tokenLength: token?.length || 0
    });
  }

  // Query state logging
  logQueryState(queryState: any) {
    this.log('INFO', 'React Query state update', {
      isLoading: queryState.isLoading,
      isError: queryState.isError,
      isFetching: queryState.isFetching,
      hasData: !!queryState.data,
      dataType: typeof queryState.data,
      errorMessage: queryState.error?.message
    });
  }

  // Component render logging
  logRenderState(contracts: any[], isLoading: boolean, error: any) {
    this.log('INFO', 'Component render state', {
      contractsCount: contracts?.length || 0,
      contractsType: typeof contracts,
      isArray: Array.isArray(contracts),
      isLoading,
      hasError: !!error,
      errorMessage: error?.message,
      sampleContract: contracts && contracts.length > 0 ? {
        id: contracts[0]._id,
        status: contracts[0].status,
        hasClient: !!contracts[0].client,
        hasFreelancer: !!contracts[0].freelancer
      } : null
    });
  }

  // Database/Backend logging helpers
  logBackendRequest(userId: string, userRole: string, filters?: any) {
    this.log('INFO', 'Backend request details', {
      userId,
      userRole,
      filters,
      timestamp: new Date().toISOString()
    });
  }

  // Error analysis
  analyzeError(error: any): string {
    if (!error) return 'No error to analyze';

    if (error.response?.status === 401) {
      return 'Authentication error - user may need to log in again';
    }
    
    if (error.response?.status === 403) {
      return 'Authorization error - user may not have permission';
    }
    
    if (error.response?.status === 404) {
      return 'API endpoint not found - check route configuration';
    }
    
    if (error.response?.status >= 500) {
      return 'Server error - check backend logs';
    }
    
    if (error.message?.includes('Network Error')) {
      return 'Network error - check if backend server is running';
    }
    
    return `Unknown error: ${error.message || 'No error message'}`;
  }

  // Get all logs
  getAllLogs() {
    return this.logs;
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.log('INFO', 'Debug logs cleared');
  }

  // Export logs as JSON
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Print summary
  printSummary() {
    const errorCount = this.logs.filter(log => log.level === 'ERROR').length;
    const warnCount = this.logs.filter(log => log.level === 'WARN').length;
    const infoCount = this.logs.filter(log => log.level === 'INFO').length;
    const successCount = this.logs.filter(log => log.level === 'SUCCESS').length;

    console.log('%c=== CONTRACTS DEBUG SUMMARY ===', 'color: #0088ff; font-size: 16px; font-weight: bold;');
    console.log(`Total logs: ${this.logs.length}`);
    console.log(`Errors: ${errorCount}`);
    console.log(`Warnings: ${warnCount}`);
    console.log(`Info: ${infoCount}`);
    console.log(`Success: ${successCount}`);
    
    if (errorCount > 0) {
      console.log('%cRecent errors:', 'color: #ff4444; font-weight: bold;');
      this.logs
        .filter(log => log.level === 'ERROR')
        .slice(-3)
        .forEach(log => console.log(`  - ${log.message}`, log.data));
    }
  }
}

// Export singleton instance
export const contractsDebugger = ContractsDebugger.getInstance();

// Global debug functions for console access
(window as any).contractsDebug = {
  getLogs: () => contractsDebugger.getAllLogs(),
  clearLogs: () => contractsDebugger.clearLogs(),
  exportLogs: () => contractsDebugger.exportLogs(),
  printSummary: () => contractsDebugger.printSummary()
};

console.log('%cContracts Debug Utility Loaded!', 'color: #00aa00; font-weight: bold;');
console.log('Use window.contractsDebug to access debug functions:');
console.log('  - contractsDebug.getLogs() - Get all debug logs');
console.log('  - contractsDebug.clearLogs() - Clear debug logs');
console.log('  - contractsDebug.exportLogs() - Export logs as JSON');
console.log('  - contractsDebug.printSummary() - Print debug summary');