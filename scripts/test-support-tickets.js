const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';
let adminToken = '';
let ticketId = '';

// Helper function to make authenticated requests
const api = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
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
    return response.data.data.tokens.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testCreateTicket() {
  console.log('\n📝 Testing: Create Support Ticket');
  try {
    const response = await api.post('/support/tickets', {
      subject: 'Test Support Ticket',
      category: 'technical',
      priority: 'medium',
      message: 'This is a test support ticket to verify the API is working correctly.',
    });
    
    const ticket = response.data.data || response.data;
    ticketId = ticket.ticketId; // Use ticketId field, not _id
    console.log('✅ Ticket created successfully');
    console.log('   Ticket ID:', ticket.ticketId);
    console.log('   Status:', ticket.status);
    return ticket;
  } catch (error) {
    console.error('❌ Failed to create ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetTickets() {
  console.log('\n📋 Testing: Get All Tickets');
  try {
    const response = await api.get('/support/tickets');
    console.log('✅ Retrieved tickets successfully');
    const tickets = response.data.data || response.data;
    console.log('   Total tickets:', tickets.length);
    return tickets;
  } catch (error) {
    console.error('❌ Failed to get tickets:', error.response?.data || error.message);
    throw error;
  }
}

async function testGetTicketById() {
  console.log('\n🔍 Testing: Get Ticket by ID');
  try {
    const response = await api.get(`/support/tickets/${ticketId}`);
    console.log('✅ Retrieved ticket successfully');
    const ticket = response.data.data || response.data;
    console.log('   Subject:', ticket.subject);
    console.log('   Messages:', ticket.messages.length);
    return ticket;
  } catch (error) {
    console.error('❌ Failed to get ticket:', error.response?.data || error.message);
    throw error;
  }
}

async function testAddMessage() {
  console.log('\n💬 Testing: Add Message to Ticket');
  try {
    const response = await api.post(`/support/tickets/${ticketId}/messages`, {
      message: 'This is a follow-up message on the support ticket.',
    });
    console.log('✅ Message added successfully');
    const ticket = response.data.data || response.data;
    console.log('   Total messages:', ticket.messages.length);
    return ticket;
  } catch (error) {
    console.error('❌ Failed to add message:', error.response?.data || error.message);
    throw error;
  }
}

async function testAdminUpdateStatus() {
  console.log('\n👨‍💼 Testing: Admin Update Ticket Status');
  try {
    // Switch to admin token
    const currentToken = authToken;
    authToken = adminToken;
    
    const response = await api.patch(`/support/tickets/${ticketId}/status`, {
      status: 'in-progress',
    });
    console.log('✅ Status updated successfully');
    const ticket = response.data.data || response.data;
    console.log('   New status:', ticket.status);
    
    // Switch back to user token
    authToken = currentToken;
    return ticket;
  } catch (error) {
    console.error('❌ Failed to update status:', error.response?.data || error.message);
    throw error;
  }
}

async function testAdminGetStats() {
  console.log('\n📊 Testing: Admin Get Ticket Stats');
  try {
    // Switch to admin token
    const currentToken = authToken;
    authToken = adminToken;
    
    const response = await api.get('/support/tickets/stats');
    console.log('✅ Stats retrieved successfully');
    const stats = response.data.data || response.data;
    console.log('   Total tickets:', stats.total);
    console.log('   Open tickets:', stats.byStatus?.open || 0);
    console.log('   In Progress:', stats.byStatus?.inProgress || 0);
    console.log('   Resolved:', stats.byStatus?.resolved || 0);
    
    // Switch back to user token
    authToken = currentToken;
    return stats;
  } catch (error) {
    console.error('❌ Failed to get stats:', error.response?.data || error.message);
    throw error;
  }
}

async function runTests() {
  console.log('🚀 Starting Support Ticket API Tests\n');
  console.log('API URL:', API_URL);
  
  try {
    // Login as regular user (freelancer or client)
    console.log('\n🔐 Logging in as user...');
    authToken = await login('alice.dev@example.com', 'Password123!');
    console.log('✅ User logged in successfully');
    
    // Login as admin
    console.log('\n🔐 Logging in as admin...');
    adminToken = await login('admin@talenthive.com', 'Password123!');
    console.log('✅ Admin logged in successfully');
    
    // Run tests
    await testCreateTicket();
    await testGetTickets();
    await testGetTicketById();
    await testAddMessage();
    await testAdminUpdateStatus();
    await testAdminGetStats();
    
    console.log('\n✅ All tests passed successfully! 🎉\n');
  } catch (error) {
    console.log('\n❌ Tests failed\n');
    process.exit(1);
  }
}

// Run the tests
runTests();
