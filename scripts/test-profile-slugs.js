const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let userId = '';
let testSlug = '';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    userId = response.data.data.user.id;
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testValidateSlug(slug) {
  console.log(`\n✔️  Testing: Validate Slug "${slug}"`);
  try {
    const response = await api.post('/users/slug/validate', { slug });
    console.log('✅ Validation result:', response.data.available ? 'Available' : 'Not available');
    console.log('   Valid format:', response.data.valid);
    if (response.data.error) {
      console.log('   Error:', response.data.error);
    }
    if (response.data.suggestions) {
      console.log('   Suggestions:', response.data.suggestions.join(', '));
    }
    return response.data;
  } catch (error) {
    console.error('❌ Failed to validate slug:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetSlugSuggestions(baseName) {
  console.log(`\n💡 Testing: Get Slug Suggestions for "${baseName}"`);
  try {
    const response = await api.get(`/users/slug/suggestions/${baseName}`);
    console.log('✅ Suggestions retrieved successfully');
    // API returns { success: true, data: ["slug1", "slug2", ...] }
    const suggestions = response.data.data || [];
    console.log('   Suggestions:', suggestions.join(', '));
    return response.data;
  } catch (error) {
    console.error('❌ Failed to get suggestions:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpdateSlug(slug) {
  console.log(`\n📝 Testing: Update User Slug to "${slug}"`);
  try {
    const response = await api.patch('/users/profile/slug', { slug });
    console.log('✅ Slug updated successfully');
    // API returns { success: true, data: { slug: "...", profileUrl: "..." } }
    const data = response.data.data || response.data;
    console.log('   New slug:', data.slug);
    console.log('   Profile URL:', data.profileUrl);
    testSlug = data.slug || slug;
    return data;
  } catch (error) {
    console.error('❌ Failed to update slug:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetUserBySlug(slug) {
  console.log(`\n🔍 Testing: Get User by Slug "${slug}"`);
  try {
    const response = await axios.get(`${API_URL}/users/slug/${slug}`);
    console.log('✅ User retrieved successfully');
    const user = response.data.data || response.data;
    console.log('   Name:', user.profile.firstName, user.profile.lastName);
    console.log('   Role:', user.role);
    console.log('   Slug:', user.profileSlug);
    return user;
  } catch (error) {
    console.error('❌ Failed to get user by slug:', error.response?.data || error.message);
    throw error;
  }
}

async function testSearchBySlug(query) {
  console.log(`\n🔎 Testing: Search Users by Slug "${query}"`);
  try {
    const response = await axios.get(`${API_URL}/users/slug/search`, {
      params: { q: query },
    });
    console.log('✅ Search completed successfully');
    const users = response.data.data || response.data;
    console.log('   Results found:', users.length);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.profile.firstName} ${user.profile.lastName} (@${user.profileSlug})`);
    });
    return users;
  } catch (error) {
    console.error('❌ Failed to search:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetSlugHistory() {
  console.log(`\n📜 Testing: Get Slug History`);
  try {
    const response = await api.get(`/users/${userId}/slug-history`);
    console.log('✅ Slug history retrieved successfully');
    const data = response.data.data || response.data;
    const history = data.history || [];
    console.log('   Current slug:', data.currentSlug);
    console.log('   History entries:', history.length);
    history.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.slug} (changed at ${new Date(entry.changedAt).toLocaleString()})`);
    });
    return data;
  } catch (error) {
    console.error('❌ Failed to get slug history:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting Profile Slug API Tests\n');
  console.log('API URL:', API_URL);
  
  try {
    console.log('\n🔐 Logging in as user...');
    authToken = await login('alice.dev@example.com', 'Password123!');
    console.log('✅ User logged in successfully');
    
    // Test slug validation
    await testValidateSlug('test-slug-available');
    await testValidateSlug('admin'); // Should be taken or reserved
    
    // Test slug suggestions
    await testGetSlugSuggestions('john-doe');
    
    // Test updating slug
    const uniqueSlug = `test-user-${Date.now()}`;
    await testUpdateSlug(uniqueSlug);
    
    // Test getting user by slug
    await testGetUserBySlug(uniqueSlug);
    
    // Test search by slug
    await testSearchBySlug('test');
    
    // Test slug history
    await testGetSlugHistory();
    
    console.log('\n✅ All tests passed successfully! 🎉\n');
  } catch (error) {
    console.log('\n❌ Tests failed\n');
    process.exit(1);
  }
}

runTests();
