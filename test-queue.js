// Simple test script to verify the task queue system
// Run with: node test-queue.js

const API_BASE = 'http://localhost:3001';

async function testTaskQueue() {
  console.log('🧪 Testing Open Jules Task Queue System...\n');

  try {
    // Test 1: Get queue status
    console.log('1. Testing queue status...');
    const statusResponse = await fetch(`${API_BASE}/api/tasks`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('✅ Queue status retrieved successfully');
      console.log(`   - Total tasks: ${status.stats.total}`);
      console.log(`   - Pending: ${status.stats.pending}`);
      console.log(`   - Running: ${status.stats.running}`);
    } else {
      console.log('❌ Failed to get queue status');
      return;
    }

    // Test 2: Add a test task
    console.log('\n2. Testing task addition...');
    const testTask = {
      token: 'test-token',
      repo: 'test/repo',
      baseBranch: 'main',
      task: 'Test task for queue system',
      agentModels: {
        planner: 'llama3',
        branchNamer: 'llama3',
        embedder: 'llama3',
        developer: 'llama3',
        reviewer: 'llama3',
        prWriter: 'llama3',
        generator: 'llama3'
      }
    };

    const addResponse = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testTask)
    });

    if (addResponse.ok) {
      const newTask = await addResponse.json();
      console.log('✅ Task added successfully');
      console.log(`   - Task ID: ${newTask.id}`);
      console.log(`   - Status: ${newTask.status}`);
      
      const taskId = newTask.id;

      // Test 3: Get specific task
      console.log('\n3. Testing get specific task...');
      const getTaskResponse = await fetch(`${API_BASE}/api/tasks/${taskId}`);
      if (getTaskResponse.ok) {
        const task = await getTaskResponse.json();
        console.log('✅ Task retrieved successfully');
        console.log(`   - Task: ${task.task}`);
        console.log(`   - Repository: ${task.repo}`);
      } else {
        console.log('❌ Failed to get specific task');
      }

      // Test 4: Cancel the task
      console.log('\n4. Testing task cancellation...');
      const cancelResponse = await fetch(`${API_BASE}/api/tasks/${taskId}/cancel`, {
        method: 'PUT'
      });
      if (cancelResponse.ok) {
        console.log('✅ Task cancelled successfully');
      } else {
        console.log('❌ Failed to cancel task');
      }

      // Test 5: Remove the task
      console.log('\n5. Testing task removal...');
      const removeResponse = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE'
      });
      if (removeResponse.ok) {
        console.log('✅ Task removed successfully');
      } else {
        console.log('❌ Failed to remove task');
      }

    } else {
      console.log('❌ Failed to add task');
      const error = await addResponse.json();
      console.log(`   Error: ${error.error}`);
    }

    // Test 6: Test queue management endpoints
    console.log('\n6. Testing queue management...');
    
    const startResponse = await fetch(`${API_BASE}/api/queue/start`, { method: 'POST' });
    console.log(`   - Start queue: ${startResponse.ok ? '✅' : '❌'}`);
    
    const pauseResponse = await fetch(`${API_BASE}/api/queue/pause`, { method: 'POST' });
    console.log(`   - Pause queue: ${pauseResponse.ok ? '✅' : '❌'}`);
    
    const clearResponse = await fetch(`${API_BASE}/api/queue/clear`, { method: 'POST' });
    console.log(`   - Clear completed: ${clearResponse.ok ? '✅' : '❌'}`);

    console.log('\n🎉 Task queue system test completed successfully!');
    console.log('\nTo test the full system:');
    console.log('1. Start the server: npm run server');
    console.log('2. Start the frontend: npm run frontend');
    console.log('3. Open http://localhost:5173 in your browser');
    console.log('4. Configure your GitHub token and agent models');
    console.log('5. Add tasks to the queue and test the functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the server is running on http://localhost:3001');
  }
}

// Run the test
testTaskQueue(); 