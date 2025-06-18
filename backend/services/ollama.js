import axios from 'axios';

export class OllamaService {
  constructor(baseURL = 'http://localhost:11434') {
    this.baseURL = baseURL;
  }

  async getModels() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`);
      return response.data.models || [];
    } catch (error) {
      console.error('Error fetching Ollama models:', error);
      throw new Error('Failed to connect to Ollama. Make sure Ollama is running on localhost:11434');
    }
  }

  async generateEmbedding(model, text) {
    try {
      const payload = {
        model: model,
        prompt: text
      };

      const response = await axios.post(`${this.baseURL}/api/embeddings`, payload);
      return response.data.embedding;
    } catch (error) {
      console.error('Error generating embedding from Ollama:', error);
      throw new Error(`Failed to generate embedding using model ${model}`);
    }
  }

  async generateResponse(model, prompt, systemPrompt = null) {
    try {
      const payload = {
        model: model,
        prompt: prompt,
        stream: false
      };

      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      const response = await axios.post(`${this.baseURL}/api/generate`, payload);
      return response.data.response;
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      throw new Error(`Failed to generate response using model ${model}`);
    }
  }

  async generateStreamResponse(model, prompt, systemPrompt = null, onChunk = null) {
    try {
      const payload = {
        model: model,
        prompt: prompt,
        stream: true
      };

      if (systemPrompt) {
        payload.system = systemPrompt;
      }

      const response = await axios.post(`${this.baseURL}/api/generate`, payload, {
        responseType: 'stream'
      });

      let fullResponse = '';
      
      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
                if (onChunk) onChunk(data.response);
              }
              if (data.done) {
                resolve(fullResponse);
              }
            } catch (e) {
              // Ignore malformed JSON lines
            }
          }
        });

        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error generating stream response from Ollama:', error);
      throw new Error(`Failed to generate stream response using model ${model}`);
    }
  }
}