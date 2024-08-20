const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:5000'; // Update this to your server URL
const NUM_USERS = 1000;
const REQUESTS_PER_USER = 10;

async function simulateUser(userId) {
  const user = {
    name: `User ${userId}`,
    email: `user${userId}@test.com`,
    password: 'password123'
  };

  try {
    // Register user
    await axios.post(`${BASE_URL}/api/users/register`, user);

    // Login
    const loginRes = await axios.post(`${BASE_URL}/api/users/login`, {
      email: user.email,
      password: user.password
    });

    const token = loginRes.data.token;

    // Simulate gameplay
    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      await axios.post(
        `${BASE_URL}/api/games/someGameId/play`,
        { bet: 10 },
        { headers: { 'x-auth-token': token } }
      );
    }
  } catch (error) {
    console.error(`Error for user ${userId}:`, error.message);
  }
}

async function runLoadTest() {
  console.log(`Starting load test with ${NUM_USERS} users, ${REQUESTS_PER_USER} requests each`);

  const startTime = performance.now();

  const userPromises = [];
  for (let i = 0; i < NUM_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  await Promise.all(userPromises);

  const endTime = performance.now();
  const totalTime = (endTime - startTime) / 1000; // Convert to seconds

  console.log(`Load test completed in ${totalTime.toFixed(2)} seconds`);
  console.log(`Total requests: ${NUM_USERS * REQUESTS_PER_USER}`);
  console.log(`Requests per second: ${((NUM_USERS * REQUESTS_PER_USER) / totalTime).toFixed(2)}`);
}

runLoadTest().catch(console.error);
