#!/usr/bin/env tsx

/**
 * API Discovery Runner
 * Script to run comprehensive Twenty API analysis
 */

import { TwentyAPIDiscovery } from '../src/tools/api-discovery.js';
import { config } from '../src/utils/config.js';
import { logger } from '../src/utils/logger.js';

async function main() {
  try {
    logger.info('Starting Twenty API Discovery Analysis...');
    
    const discoveryTool = new TwentyAPIDiscovery({
      twentyApiUrl: config.TWENTY_API_URL,
      twentyApiKey: config.TWENTY_API_KEY,
      maxConcurrentRequests: config.MAX_CONCURRENT_REQUESTS,
      testIterations: 5, // Keep low for initial testing
    });

    // Run comprehensive analysis
    const report = await discoveryTool.runCompleteAnalysis();
    
    // Save report with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `./reports/api-discovery-${timestamp}.json`;
    
    // Ensure reports directory exists
    const fs = await import('fs/promises');
    try {
      await fs.mkdir('./reports', { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    await discoveryTool.saveReport(report, reportPath);
    
    // Print summary
    console.log('\n=== API Discovery Summary ===');
    console.log(`Twenty Version: ${report.twentyVersion}`);
    console.log(`Analysis completed at: ${report.timestamp}`);
    console.log(`\nPerformance Comparison:`);
    console.log(`- Faster API: ${report.performanceMetrics.comparison.fasterAPI}`);
    console.log(`- GraphQL operations tested: ${report.performanceMetrics.graphql.length}`);
    console.log(`- REST operations tested: ${report.performanceMetrics.rest.length}`);
    
    console.log(`\nSchema Analysis:`);
    console.log(`- Custom fields detected: ${Object.keys(report.schemaAnalysis.customFields).length}`);
    console.log(`- Relationships mapped: ${Object.keys(report.schemaAnalysis.relationships).length}`);
    console.log(`- Data types found: ${report.schemaAnalysis.dataTypes.length}`);
    
    console.log(`\nRate Limiting:`);
    console.log(`- Limits detected: ${report.rateLimiting.limitsDetected}`);
    console.log(`- Max requests/minute: ${report.rateLimiting.maxRequestsPerMinute}`);
    console.log(`- Recommended batch size: ${report.rateLimiting.recommendedBatchSize}`);
    
    console.log(`\nCaching:`);
    console.log(`- Cacheable endpoints: ${report.cacheAnalysis.cacheable.length}`);
    
    console.log(`\nTop Recommendations:`);
    report.recommendations.optimization.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    console.log(`\nFull report saved to: ${reportPath}`);
    console.log(`\n💡 Management Commands:`);
    console.log(`   • Check Twenty: npm run twenty:status`);
    console.log(`   • View logs: npm run twenty:logs`);
    console.log(`   • Restart: npm run twenty:quick`);
    
  } catch (error) {
    logger.error('API discovery failed:', error);
    console.error('API Discovery failed. Check logs for details.');
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Check Twenty status: npm run twenty:status');
    console.error('   • Start Twenty: npm run twenty:quick');
    console.error('   • View logs: npm run twenty:logs');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}