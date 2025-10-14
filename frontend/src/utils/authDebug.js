// 管理后台权限问题诊断脚本
// Usage: Copy and execute this script in browser console

(function() {
  console.log('===== Admin Panel Permission Diagnostic Started =====');
  
  // Check authentication information in localStorage
  console.log('\n--- Current localStorage Status ---');
  console.log('admin_token exists:', localStorage.getItem('admin_token') ? 'Yes' : 'No');
  console.log('isLoggedIn value:', localStorage.getItem('isLoggedIn'));
  console.log('userRole value:', localStorage.getItem('userRole'));
  console.log('token length:', localStorage.getItem('admin_token') ? localStorage.getItem('admin_token').length : 0);
  
  // Check all auth-related keys in localStorage
  console.log('\n--- All Keys in localStorage ---');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('token') || key.includes('role') || key.includes('login')) {
      console.log(`Key: ${key}, Value: ${localStorage.getItem(key)}`);
    }
  }
  
  // Simulate role setting process after login
  console.log('\n--- Simulated Role Setting Process ---');
  const mockRoles1 = ['admin']; // Simulate array format roles
  const mockRoles2 = '["admin"]'; // Simulate JSON string format roles
  
  // Test 1: Array format roles
  let parsedRoles1 = [];
  if (Array.isArray(mockRoles1)) {
    parsedRoles1 = mockRoles1;
  } else if (typeof mockRoles1 === 'string') {
    try {
      parsedRoles1 = JSON.parse(mockRoles1);
    } catch (e) {
      parsedRoles1 = ['admin'];
    }
  }
  console.log('Test 1 - Array format role parsing result:', parsedRoles1);
  
  // Test 2: JSON string format roles
  let parsedRoles2 = [];
  if (Array.isArray(mockRoles2)) {
    parsedRoles2 = mockRoles2;
  } else if (typeof mockRoles2 === 'string') {
    try {
      parsedRoles2 = JSON.parse(mockRoles2);
    } catch (e) {
      parsedRoles2 = ['admin'];
    }
  }
  console.log('Test 2 - JSON string format role parsing result:', parsedRoles2);
  
  // Check router guard logic
  console.log('\n--- Simulated Router Guard Check ---');
  const currentUserRole = localStorage.getItem('userRole') || '';
  const allowedRoles = ['admin', 'super_admin'];
  const hasAccess = allowedRoles.includes(currentUserRole);
  
  console.log('Current user role:', currentUserRole);
  console.log('Allowed roles list:', allowedRoles);
  console.log('Has admin permission:', hasAccess ? 'Yes' : 'No');
  if (!hasAccess) {
    console.log('Insufficient permission reason:', `'${currentUserRole}' is not in the allowed roles list`);
  }
  
  // Provide cleanup and reset function
  console.log('\n--- Diagnostic Completed ---');
  console.log('To reset login status, execute the following command:');
  console.log('localStorage.removeItem(\'admin_token\'); localStorage.removeItem(\'userRole\'); localStorage.removeItem(\'isLoggedIn\');');
  console.log('\n===== Admin Panel Permission Diagnostic Ended =====');
})();