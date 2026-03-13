const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Store active jobs
const jobs = {};

// API: Generate video
app.post('/api/generate', async (req, res) => {
  const { topic, platform, duration, style } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('videos')
      .insert([
        { 
          topic, 
          platform, 
          duration, 
          style, 
          status: 'queued',
          progress: 0
        }
      ])
      .select();
    
    if (error) throw error;
    
    const jobId = data[0].id;
    
    jobs[jobId] = {
      id: jobId,
      status: 'queued',
      progress: 0,
      topic,
      platform,
      duration,
      style
    };
    
    // Simulate generation
    simulateGeneration(jobId);
    
    res.json({ jobId, message: 'Video generation queued' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Check job status
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs[jobId];
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Simulate generation
function simulateGeneration(jobId) {
  const stages = ['scripting', 'generating', 'processing', 'complete'];
  let stage = 0;
  
  const interval = setInterval(() => {
    if (stage < stages.length) {
      jobs[jobId].status = stages[stage];
      jobs[jobId].progress = Math.min((stage + 1) * 25, 100);
      
      if (stages[stage] === 'complete') {
        jobs[jobId].videoUrl = 'https://example.com/sample-video.mp4';
        clearInterval(interval);
      }
      
      stage++;
    }
  }, 5000);
}

// API: Check credits
app.get('/api/credits/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('credits_remaining, tier')
    .eq('id', userId)
    .single();
  
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  
  res.json(data);
});

const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});