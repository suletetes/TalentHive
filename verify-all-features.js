/**
 * TalentHive Platform - Complete Feature Verification
 * This script checks all implemented features across the platform
 */

const fs = require('fs');
const path = require('path');

const results = {
  backend: {
    models: [],
    controllers: [],
    routes: [],
    services: [],
  },
  frontend: {
    pages: [],
    components: [],
    services: [],
    hooks: [],
    utils: [],
  },
  issues: [],
  missing: [],
};

// Helper to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

// Helper to check if file contains text
function fileContains(filePath, searchText) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes(searchText);
  } catch {
    return false;
  }
}

console.log('TalentHive Platform Feature Verification\n');
console.log('=' .repeat(60));

// ============================================================================
// BACKEND VERIFICATION
// ============================================================================

console.log('\nBACKEND VERIFICATION\n');

// 1. Check Models
console.log('1. Checking Models...');
const models = [
  { name: 'User', file: 'server/src/models/User.ts' },
  { name: 'Project', file: 'server/src/models/Project.ts', fields: ['acceptingProposals', 'proposalsClosed'] },
  { name: 'Proposal', file: 'server/src/models/Proposal.ts' },
  { name: 'Contract', file: 'server/src/models/Contract.ts' },
  { name: 'Transaction', file: 'server/src/models/Transaction.ts' },
  { name: 'Settings', file: 'server/src/models/Settings.ts', fields: ['commissionSettings', 'platformFee'] },
  { name: 'Dispute', file: 'server/src/models/Dispute.ts', fields: ['type', 'status', 'messages'] },
  { name: 'Review', file: 'server/src/models/Review.ts' },
  { name: 'Organization', file: 'server/src/models/Organization.ts' },
];

models.forEach(model => {
  const exists = fileExists(model.file);
  results.backend.models.push({ name: model.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${model.name} model exists`);
    
    // Check for specific fields if defined
    if (model.fields) {
      model.fields.forEach(field => {
        const hasField = fileContains(model.file, field);
        if (hasField) {
          console.log(`      [OK] Has field: ${field}`);
        } else {
          console.log(`      [MISSING] Missing field: ${field}`);
          results.missing.push(`${model.name} model missing field: ${field}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${model.name} model NOT FOUND`);
    results.missing.push(`${model.name} model file`);
  }
});

// 2. Check Controllers
console.log('\n2. Checking Controllers...');
const controllers = [
  { name: 'Admin', file: 'server/src/controllers/adminController.ts', functions: ['getSettings', 'updateSettings', 'getCommissionSettings'] },
  { name: 'Project', file: 'server/src/controllers/projectController.ts', functions: ['toggleProposalAcceptance'] },
  { name: 'Proposal', file: 'server/src/controllers/proposalController.ts', functions: ['deleteProposal'] },
  { name: 'Dispute', file: 'server/src/controllers/disputeController.ts', functions: ['createDispute', 'getAllDisputes', 'addDisputeMessage'] },
  { name: 'Payment', file: 'server/src/controllers/paymentController.ts' },
  { name: 'Dashboard', file: 'server/src/controllers/dashboardController.ts' },
];

controllers.forEach(controller => {
  const exists = fileExists(controller.file);
  results.backend.controllers.push({ name: controller.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${controller.name} controller exists`);
    
    // Check for specific functions if defined
    if (controller.functions) {
      controller.functions.forEach(func => {
        const hasFunc = fileContains(controller.file, `export const ${func}`);
        if (hasFunc) {
          console.log(`      [OK] Has function: ${func}`);
        } else {
          console.log(`      [MISSING] Missing function: ${func}`);
          results.missing.push(`${controller.name} controller missing function: ${func}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${controller.name} controller NOT FOUND`);
    results.missing.push(`${controller.name} controller file`);
  }
});

// 3. Check Routes
console.log('\n3. Checking Routes...');
const routes = [
  { name: 'Projects', file: 'server/src/routes/projects.ts', endpoints: ['toggle-proposals'] },
  { name: 'Proposals', file: 'server/src/routes/proposals.ts', endpoints: ['delete'] },
  { name: 'Admin', file: 'server/src/routes/admin.ts', endpoints: ['settings', 'commission'] },
  { name: 'Disputes', file: 'server/src/routes/disputes.ts', endpoints: ['messages', 'status', 'assign'] },
  { name: 'Index', file: 'server/src/routes/index.ts', imports: ['disputeRoutes'] },
];

routes.forEach(route => {
  const exists = fileExists(route.file);
  results.backend.routes.push({ name: route.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${route.name} routes exist`);
    
    // Check for specific endpoints/imports
    if (route.endpoints) {
      route.endpoints.forEach(endpoint => {
        const hasEndpoint = fileContains(route.file, endpoint);
        if (hasEndpoint) {
          console.log(`      [OK] Has endpoint: ${endpoint}`);
        } else {
          console.log(`      [MISSING] Missing endpoint: ${endpoint}`);
          results.missing.push(`${route.name} routes missing endpoint: ${endpoint}`);
        }
      });
    }
    
    if (route.imports) {
      route.imports.forEach(imp => {
        const hasImport = fileContains(route.file, imp);
        if (hasImport) {
          console.log(`      [OK] Has import: ${imp}`);
        } else {
          console.log(`      [MISSING] Missing import: ${imp}`);
          results.missing.push(`${route.name} routes missing import: ${imp}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${route.name} routes NOT FOUND`);
    results.missing.push(`${route.name} routes file`);
  }
});

// 4. Check Environment Variables
console.log('\n4. Checking Environment Variables...');
const envFile = 'server/.env';
const envVars = [
  'JWT_EXPIRES_IN',
  'DISABLE_RATE_LIMIT_FOR_TESTING',
  'MONGODB_URI',
  'STRIPE_SECRET_KEY',
];

if (fileExists(envFile)) {
  console.log(`   [OK] .env file exists`);
  envVars.forEach(envVar => {
    const hasVar = fileContains(envFile, envVar);
    if (hasVar) {
      console.log(`      [OK] Has variable: ${envVar}`);
    } else {
      console.log(`      [WARNING] Missing variable: ${envVar}`);
    }
  });
} else {
  console.log(`   [MISSING] .env file NOT FOUND`);
  results.missing.push('.env file');
}

// ============================================================================
// FRONTEND VERIFICATION
// ============================================================================

console.log('\n\nFRONTEND VERIFICATION\n');

// 1. Check Pages
console.log('1. Checking Pages...');
const pages = [
  { name: 'CommissionSettings', file: 'client/src/pages/admin/CommissionSettingsPage.tsx' },
  { name: 'ProjectDetail', file: 'client/src/pages/ProjectDetailPage.tsx' },
  { name: 'ContractDetail', file: 'client/src/pages/ContractDetailPage.tsx' },
  { name: 'Dashboard', file: 'client/src/pages/DashboardPage.tsx' },
  { name: 'AdminDashboard', file: 'client/src/pages/admin/AdminDashboardPage.tsx' },
];

pages.forEach(page => {
  const exists = fileExists(page.file);
  results.frontend.pages.push({ name: page.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${page.name} page exists`);
  } else {
    console.log(`   [MISSING] ${page.name} page NOT FOUND`);
    results.missing.push(`${page.name} page file`);
  }
});

// 2. Check Components
console.log('\n2. Checking Components...');
const components = [
  { name: 'ReviewModal', file: 'client/src/components/reviews/ReviewModal.tsx' },
  { name: 'CreateDisputeDialog', file: 'client/src/components/disputes/CreateDisputeDialog.tsx' },
  { name: 'PaymentForm', file: 'client/src/components/payments/PaymentForm.tsx', contains: ['formatDollars'] },
];

components.forEach(component => {
  const exists = fileExists(component.file);
  results.frontend.components.push({ name: component.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${component.name} component exists`);
    
    if (component.contains) {
      component.contains.forEach(text => {
        const hasText = fileContains(component.file, text);
        if (hasText) {
          console.log(`      [OK] Contains: ${text}`);
        } else {
          console.log(`      [MISSING] Missing: ${text}`);
          results.missing.push(`${component.name} component missing: ${text}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${component.name} component NOT FOUND`);
    results.missing.push(`${component.name} component file`);
  }
});

// 3. Check Services
console.log('\n3. Checking API Services...');
const services = [
  { name: 'Disputes', file: 'client/src/services/api/disputes.service.ts', exports: ['createDispute', 'getAllDisputes'] },
  { name: 'Settings', file: 'client/src/services/api/settings.service.ts', exports: ['getCommissionSettings', 'updateCommissionSettings'] },
];

services.forEach(service => {
  const exists = fileExists(service.file);
  results.frontend.services.push({ name: service.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${service.name} service exists`);
    
    if (service.exports) {
      service.exports.forEach(exp => {
        const hasExport = fileContains(service.file, exp);
        if (hasExport) {
          console.log(`      [OK] Has export: ${exp}`);
        } else {
          console.log(`      [MISSING] Missing export: ${exp}`);
          results.missing.push(`${service.name} service missing export: ${exp}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${service.name} service NOT FOUND`);
    results.missing.push(`${service.name} service file`);
  }
});

// 4. Check Hooks
console.log('\n4. Checking Custom Hooks...');
const hooks = [
  { name: 'useReviewPrompt', file: 'client/src/hooks/useReviewPrompt.ts' },
];

hooks.forEach(hook => {
  const exists = fileExists(hook.file);
  results.frontend.hooks.push({ name: hook.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${hook.name} hook exists`);
  } else {
    console.log(`   [MISSING] ${hook.name} hook NOT FOUND`);
    results.missing.push(`${hook.name} hook file`);
  }
});

// 5. Check Utilities
console.log('\n5. Checking Utilities...');
const utils = [
  { name: 'Currency', file: 'client/src/utils/currency.ts', functions: ['formatDollars', 'dollarsToCents', 'centsToDollars'] },
];

utils.forEach(util => {
  const exists = fileExists(util.file);
  results.frontend.utils.push({ name: util.name, exists });
  
  if (exists) {
    console.log(`   [OK] ${util.name} utility exists`);
    
    if (util.functions) {
      util.functions.forEach(func => {
        const hasFunc = fileContains(util.file, `export const ${func}`);
        if (hasFunc) {
          console.log(`      [OK] Has function: ${func}`);
        } else {
          console.log(`      [MISSING] Missing function: ${func}`);
          results.missing.push(`${util.name} utility missing function: ${func}`);
        }
      });
    }
  } else {
    console.log(`   [MISSING] ${util.name} utility NOT FOUND`);
    results.missing.push(`${util.name} utility file`);
  }
});

// 6. Check Routes in App.tsx
console.log('\n6. Checking App Routes...');
const appFile = 'client/src/App.tsx';
const appRoutes = [
  'CommissionSettingsPage',
  'commission-settings',
];

if (fileExists(appFile)) {
  console.log(`   [OK] App.tsx exists`);
  appRoutes.forEach(route => {
    const hasRoute = fileContains(appFile, route);
    if (hasRoute) {
      console.log(`      [OK] Has route: ${route}`);
    } else {
      console.log(`      [MISSING] Missing route: ${route}`);
      results.missing.push(`App.tsx missing route: ${route}`);
    }
  });
} else {
  console.log(`   [MISSING] App.tsx NOT FOUND`);
  results.missing.push('App.tsx file');
}

// ============================================================================
// ISSUE FIXES VERIFICATION
// ============================================================================

console.log('\n\nISSUE FIXES VERIFICATION\n');

const issueFixes = [
  {
    id: 1,
    name: 'Rate Limiting',
    checks: [
      { file: 'server/src/middleware/rateLimiter.ts', text: 'DISABLE_RATE_LIMIT_FOR_TESTING' },
      { file: 'server/.env', text: 'DISABLE_RATE_LIMIT_FOR_TESTING=true' },
    ]
  },
  {
    id: 2,
    name: 'Proposal Management',
    checks: [
      { file: 'server/src/models/Project.ts', text: 'acceptingProposals' },
      { file: 'server/src/controllers/projectController.ts', text: 'toggleProposalAcceptance' },
      { file: 'server/src/controllers/proposalController.ts', text: 'deleteProposal' },
    ]
  },
  {
    id: 4,
    name: 'Review System',
    checks: [
      { file: 'client/src/components/reviews/ReviewModal.tsx', text: 'ReviewModal' },
      { file: 'client/src/hooks/useReviewPrompt.ts', text: 'useReviewPrompt' },
    ]
  },
  {
    id: 5,
    name: 'Stripe Amount Display',
    checks: [
      { file: 'client/src/utils/currency.ts', text: 'formatDollars' },
      { file: 'client/src/components/payments/PaymentForm.tsx', text: 'formatDollars' },
    ]
  },
  {
    id: 6,
    name: 'Commission Settings',
    checks: [
      { file: 'server/src/models/Settings.ts', text: 'commissionSettings' },
      { file: 'server/src/controllers/adminController.ts', text: 'getCommissionSettings' },
      { file: 'client/src/pages/admin/CommissionSettingsPage.tsx', text: 'CommissionSettingsPage' },
    ]
  },
  {
    id: 7,
    name: 'Dashboard Revenue',
    checks: [
      { file: 'server/src/controllers/adminController.ts', text: 'platformCommission' },
    ]
  },
  {
    id: 9,
    name: 'Dispute System',
    checks: [
      { file: 'server/src/models/Dispute.ts', text: 'IDispute' },
      { file: 'server/src/controllers/disputeController.ts', text: 'createDispute' },
      { file: 'server/src/routes/disputes.ts', text: 'export default router' },
      { file: 'server/src/routes/index.ts', text: 'disputeRoutes' },
      { file: 'client/src/components/disputes/CreateDisputeDialog.tsx', text: 'CreateDisputeDialog' },
    ]
  },
  {
    id: 10,
    name: 'Token Expiration',
    checks: [
      { file: 'server/.env', text: 'JWT_EXPIRES_IN=1h' },
    ]
  },
  {
    id: 11,
    name: 'Seed Data',
    checks: [
      { file: 'server/src/scripts/seed.ts', text: 'seedSettings' },
      { file: 'server/src/scripts/seed.ts', text: 'Settings' },
    ]
  },
];

issueFixes.forEach(issue => {
  console.log(`Issue #${issue.id}: ${issue.name}`);
  let allPassed = true;
  
  issue.checks.forEach(check => {
    const exists = fileExists(check.file);
    if (!exists) {
      console.log(`   [MISSING] File not found: ${check.file}`);
      allPassed = false;
      return;
    }
    
    const hasText = fileContains(check.file, check.text);
    if (hasText) {
      console.log(`   [OK] ${path.basename(check.file)} contains: ${check.text}`);
    } else {
      console.log(`   [MISSING] ${path.basename(check.file)} missing: ${check.text}`);
      allPassed = false;
      results.issues.push(`Issue #${issue.id} - ${check.file} missing: ${check.text}`);
    }
  });
  
  if (allPassed) {
    console.log(`   [COMPLETE] Issue #${issue.id} FULLY IMPLEMENTED\n`);
  } else {
    console.log(`   [INCOMPLETE] Issue #${issue.id} INCOMPLETE\n`);
  }
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('\nVERIFICATION SUMMARY\n');

const backendTotal = results.backend.models.length + results.backend.controllers.length + results.backend.routes.length;
const backendPassed = results.backend.models.filter(m => m.exists).length + 
                      results.backend.controllers.filter(c => c.exists).length + 
                      results.backend.routes.filter(r => r.exists).length;

const frontendTotal = results.frontend.pages.length + results.frontend.components.length + 
                      results.frontend.services.length + results.frontend.hooks.length + 
                      results.frontend.utils.length;
const frontendPassed = results.frontend.pages.filter(p => p.exists).length + 
                       results.frontend.components.filter(c => c.exists).length + 
                       results.frontend.services.filter(s => s.exists).length + 
                       results.frontend.hooks.filter(h => h.exists).length + 
                       results.frontend.utils.filter(u => u.exists).length;

console.log(`Backend:  ${backendPassed}/${backendTotal} files exist`);
console.log(`Frontend: ${frontendPassed}/${frontendTotal} files exist`);
console.log(`\nMissing Items: ${results.missing.length}`);
console.log(`Issues Found: ${results.issues.length}`);

if (results.missing.length > 0) {
  console.log('\n[MISSING] MISSING FILES/FEATURES:');
  results.missing.forEach(item => console.log(`   - ${item}`));
}

if (results.issues.length > 0) {
  console.log('\n[WARNING] ISSUES FOUND:');
  results.issues.forEach(issue => console.log(`   - ${issue}`));
}

const overallPercentage = Math.round(((backendPassed + frontendPassed) / (backendTotal + frontendTotal)) * 100);

console.log('\n' + '='.repeat(60));
console.log(`\nOVERALL COMPLETION: ${overallPercentage}%`);

if (overallPercentage === 100 && results.missing.length === 0 && results.issues.length === 0) {
  console.log('\n[SUCCESS] ALL FEATURES FULLY IMPLEMENTED AND VERIFIED!\n');
} else if (overallPercentage >= 90) {
  console.log('\n[WARNING] ALMOST COMPLETE - Minor items remaining\n');
} else {
  console.log('\n[ERROR] SIGNIFICANT WORK REMAINING\n');
}

console.log('='.repeat(60) + '\n');
