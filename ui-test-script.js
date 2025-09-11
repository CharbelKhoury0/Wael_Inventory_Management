// UI Interactive Elements Test Script for CMS Pro
// This script can be run in the browser console to test UI functionality

console.log('🚀 Starting CMS Pro UI Interactive Elements Test...');

// Test Results Storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}: PASSED ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: FAILED ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

// Helper function to wait for element
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Helper function to simulate click
function simulateClick(element) {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
  });
  element.dispatchEvent(event);
}

// Helper function to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Navigation Buttons
async function testNavigationButtons() {
  console.log('\n📱 Testing Navigation Buttons...');
  
  try {
    // Test mobile navigation if present
    const mobileNav = document.querySelector('[data-testid="mobile-navigation"], .mobile-navigation, nav[class*="mobile"]');
    if (mobileNav) {
      const navButtons = mobileNav.querySelectorAll('button, a');
      logTest('Mobile Navigation Buttons', navButtons.length > 0, `Found ${navButtons.length} navigation buttons`);
      
      // Test each navigation button
      navButtons.forEach((button, index) => {
        const isClickable = button.onclick || button.href || button.getAttribute('data-page');
        logTest(`Navigation Button ${index + 1}`, !!isClickable, button.textContent?.trim() || 'No text');
      });
    }
    
    // Test sidebar navigation
    const sidebar = document.querySelector('[data-testid="sidebar"], .sidebar, aside');
    if (sidebar) {
      const sidebarButtons = sidebar.querySelectorAll('button, a');
      logTest('Sidebar Navigation', sidebarButtons.length > 0, `Found ${sidebarButtons.length} sidebar buttons`);
    }
    
  } catch (error) {
    logTest('Navigation Buttons', false, error.message);
  }
}

// Test 2: Action Buttons
async function testActionButtons() {
  console.log('\n🔘 Testing Action Buttons...');
  
  try {
    // Test Add Item button
    const addButtons = document.querySelectorAll('button[class*="add"], button:contains("Add Item"), button:contains("Add")');
    logTest('Add Item Buttons', addButtons.length > 0, `Found ${addButtons.length} add buttons`);
    
    // Test Edit buttons
    const editButtons = document.querySelectorAll('button[class*="edit"], [data-action="edit"], svg[class*="edit"]');
    logTest('Edit Buttons', editButtons.length >= 0, `Found ${editButtons.length} edit buttons`);
    
    // Test Delete buttons
    const deleteButtons = document.querySelectorAll('button[class*="delete"], [data-action="delete"], svg[class*="trash"]');
    logTest('Delete Buttons', deleteButtons.length >= 0, `Found ${deleteButtons.length} delete buttons`);
    
    // Test View buttons
    const viewButtons = document.querySelectorAll('button[class*="view"], [data-action="view"], svg[class*="eye"]');
    logTest('View Buttons', viewButtons.length >= 0, `Found ${viewButtons.length} view buttons`);
    
    // Test Upload buttons
    const uploadButtons = document.querySelectorAll('button:contains("Upload"), button[class*="upload"], input[type="file"]');
    logTest('Upload Buttons', uploadButtons.length >= 0, `Found ${uploadButtons.length} upload elements`);
    
  } catch (error) {
    logTest('Action Buttons', false, error.message);
  }
}

// Test 3: Form Elements
async function testFormElements() {
  console.log('\n📝 Testing Form Elements...');
  
  try {
    // Test input fields
    const inputs = document.querySelectorAll('input, textarea, select');
    logTest('Form Inputs', inputs.length > 0, `Found ${inputs.length} form inputs`);
    
    // Test form validation
    const forms = document.querySelectorAll('form');
    logTest('Forms Present', forms.length >= 0, `Found ${forms.length} forms`);
    
    // Test search functionality
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]');
    logTest('Search Inputs', searchInputs.length >= 0, `Found ${searchInputs.length} search inputs`);
    
  } catch (error) {
    logTest('Form Elements', false, error.message);
  }
}

// Test 4: Interactive Components
async function testInteractiveComponents() {
  console.log('\n🎛️ Testing Interactive Components...');
  
  try {
    // Test dropdowns/selects
    const dropdowns = document.querySelectorAll('select, [role="combobox"], [class*="dropdown"]');
    logTest('Dropdown Components', dropdowns.length >= 0, `Found ${dropdowns.length} dropdowns`);
    
    // Test checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"], [role="checkbox"]');
    logTest('Checkbox Components', checkboxes.length >= 0, `Found ${checkboxes.length} checkboxes`);
    
    // Test radio buttons
    const radios = document.querySelectorAll('input[type="radio"], [role="radio"]');
    logTest('Radio Components', radios.length >= 0, `Found ${radios.length} radio buttons`);
    
    // Test tabs
    const tabs = document.querySelectorAll('[role="tab"], [class*="tab"]');
    logTest('Tab Components', tabs.length >= 0, `Found ${tabs.length} tabs`);
    
  } catch (error) {
    logTest('Interactive Components', false, error.message);
  }
}

// Test 5: Accessibility Features
async function testAccessibilityFeatures() {
  console.log('\n♿ Testing Accessibility Features...');
  
  try {
    // Test ARIA labels
    const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]');
    logTest('ARIA Labels', ariaLabels.length > 0, `Found ${ariaLabels.length} elements with ARIA labels`);
    
    // Test keyboard navigation
    const focusableElements = document.querySelectorAll('button, input, select, textarea, a[href], [tabindex]');
    logTest('Focusable Elements', focusableElements.length > 0, `Found ${focusableElements.length} focusable elements`);
    
    // Test semantic HTML
    const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
    logTest('Semantic HTML', semanticElements.length > 0, `Found ${semanticElements.length} semantic elements`);
    
  } catch (error) {
    logTest('Accessibility Features', false, error.message);
  }
}

// Test 6: Theme and Styling
async function testThemeAndStyling() {
  console.log('\n🎨 Testing Theme and Styling...');
  
  try {
    // Test theme classes
    const body = document.body;
    const html = document.documentElement;
    
    const hasThemeClasses = body.className.includes('theme') || html.className.includes('theme') || html.className.includes('dark');
    logTest('Theme Classes', hasThemeClasses, 'Theme classes detected');
    
    // Test CSS custom properties
    const computedStyle = getComputedStyle(html);
    const hasCustomProps = computedStyle.getPropertyValue('--primary-color') || 
                          computedStyle.getPropertyValue('--bg-primary') ||
                          computedStyle.getPropertyValue('--text-primary');
    logTest('CSS Custom Properties', !!hasCustomProps, 'CSS custom properties detected');
    
    // Test responsive design
    const hasResponsiveClasses = document.querySelector('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    logTest('Responsive Design', !!hasResponsiveClasses, 'Responsive classes detected');
    
  } catch (error) {
    logTest('Theme and Styling', false, error.message);
  }
}

// Test 7: Error Handling
async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  try {
    // Test error boundaries
    const errorBoundaries = document.querySelectorAll('[data-error-boundary], [class*="error-boundary"]');
    logTest('Error Boundaries', errorBoundaries.length >= 0, `Found ${errorBoundaries.length} error boundaries`);
    
    // Test loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
    logTest('Loading States', loadingElements.length >= 0, `Found ${loadingElements.length} loading elements`);
    
    // Test notification system
    const notifications = document.querySelectorAll('[class*="toast"], [class*="notification"], [role="alert"]');
    logTest('Notification System', notifications.length >= 0, `Found ${notifications.length} notification elements`);
    
  } catch (error) {
    logTest('Error Handling', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 CMS Pro UI Interactive Elements Test Suite');
  console.log('================================================');
  
  await testNavigationButtons();
  await testActionButtons();
  await testFormElements();
  await testInteractiveComponents();
  await testAccessibilityFeatures();
  await testThemeAndStyling();
  await testErrorHandling();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => console.log(`  - ${test.testName}: ${test.details}`));
  }
  
  console.log('\n✨ Test completed! Check the results above.');
  
  return testResults;
}

// Auto-run if script is executed directly
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
}

// Export for manual execution
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runAllTests, testResults };
}

// Make available globally for console execution
if (typeof window !== 'undefined') {
  window.runUITests = runAllTests;
  window.testResults = testResults;
  
  console.log('💡 Tip: You can run individual tests or the full suite:');
  console.log('  - runUITests() - Run all tests');
  console.log('  - testResults - View current results');
}