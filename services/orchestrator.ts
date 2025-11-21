
import { bus } from './eventBus';
import { fs } from './fileSystem';

/**
 * Google AI Orchestrator
 * Manages Veo3, Imagen4, Lyria, and Swarm operations.
 * 
 * UPGRADE: Now uses Pollinations.ai for real image generation and 
 * smart keyword mapping for diverse video/audio simulation.
 */

// Curated list of high-quality diverse video samples
const VIDEO_LIBRARY = [
    { keywords: ['city', 'urban', 'future', 'cyberpunk', 'night', 'neon'], url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
    { keywords: ['nature', 'water', 'forest', 'mountain', 'river', 'landscape'], url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
    { keywords: ['tech', 'code', 'digital', 'abstract', 'data', 'computer'], url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
    { keywords: ['space', 'star', 'galaxy', 'planet', 'mars', 'universe'], url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
    { keywords: ['fast', 'car', 'speed', 'action', 'drive', 'racing'], url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4' },
    { keywords: ['family', 'people', 'happy', 'life', 'fun'], url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
    { keywords: ['animal', 'rabbit', 'bunny', 'cartoon', 'cute'], url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
    { keywords: ['sea', 'ocean', 'fish', 'underwater'], url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' } // Fallback mapping
];

const AUDIO_LIBRARY = [
    { keywords: ['upbeat', 'happy', 'pop', 'energy', 'dance'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { keywords: ['sad', 'emotional', 'slow', 'piano', 'drama'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { keywords: ['tech', 'future', 'synth', 'cyber', 'electronic'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
    { keywords: ['rock', 'intense', 'action', 'guitar'], url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3' }
];

export class GoogleAIOrchestrator {
    
    public async generateMedia(service: string, prompt: string, paramsStr: string): Promise<any> {
        bus.emit('shell-output', `[Orchestrator] 🎨 Requesting ${service.toUpperCase()} generation...`);
        bus.emit('agent-message', { agent: 'Media Studio', text: `🎨 Generating ${service} content: "${prompt}"...` });

        // Simulate processing time based on complexity
        const delay = Math.floor(Math.random() * 2000) + 1500;
        await new Promise(r => setTimeout(r, delay));

        const id = Math.random().toString(36).substr(2, 9);
        let resultFile = '';
        let content = '';

        const cleanPrompt = prompt.toLowerCase();

        switch (service) {
            case 'veo3':
                // Video Generation Simulation
                // We select the best matching video from our library based on keywords
                resultFile = `/workspace/media/veo3_video_${id}.mp4`;
                
                // Find ALL matches
                const matchedVideos = VIDEO_LIBRARY.filter(v => v.keywords.some(k => cleanPrompt.includes(k)));
                
                // Select RANDOM match to avoid repetition
                let selectedVideoUrl = '';
                if (matchedVideos.length > 0) {
                    const idx = Math.floor(Math.random() * matchedVideos.length);
                    selectedVideoUrl = matchedVideos[idx].url;
                } else {
                    // Random fallback from entire library
                    const idx = Math.floor(Math.random() * VIDEO_LIBRARY.length);
                    selectedVideoUrl = VIDEO_LIBRARY[idx].url;
                }
                
                content = selectedVideoUrl;
                bus.emit('shell-output', `[Veo3] 🎥 Rendering high-fidelity video stream...`);
                break;

            case 'imagen4':
                // Real Image Generation using Pollinations AI
                resultFile = `/workspace/media/imagen4_img_${id}.jpg`;
                
                // Enhance prompt for better results
                const enhancedPrompt = encodeURIComponent(`${prompt}, high quality, 8k, highly detailed, masterpiece, trending on artstation, sharp focus`);
                
                // CRITICAL: Add random seed to ensure unique images for same prompt
                const seed = Math.floor(Math.random() * 1000000);
                content = `https://image.pollinations.ai/prompt/${enhancedPrompt}?nologo=true&width=1280&height=720&seed=${seed}&model=flux`;
                
                bus.emit('shell-output', `[Imagen4] 🖼️ Synthesizing pixels (Seed: ${seed})...`);
                break;

            case 'lyria':
                // Audio Generation Simulation
                resultFile = `/workspace/media/lyria_audio_${id}.mp3`;
                
                const matchedAudios = AUDIO_LIBRARY.filter(a => a.keywords.some(k => cleanPrompt.includes(k)));
                
                if (matchedAudios.length > 0) {
                    const idx = Math.floor(Math.random() * matchedAudios.length);
                    content = matchedAudios[idx].url;
                } else {
                    const idx = Math.floor(Math.random() * AUDIO_LIBRARY.length);
                    content = AUDIO_LIBRARY[idx].url;
                }
                
                bus.emit('shell-output', `[Lyria] 🎵 Composing audio track...`);
                break;

            default:
                return { error: "Unknown service" };
        }

        if (!fs.exists('/workspace/media')) fs.mkdir('/workspace/media');
        
        // Write the URL/Content to the file system
        fs.writeFile(resultFile, content);
        
        bus.emit('shell-output', `[Orchestrator] ✅ ${service} generation complete: ${resultFile}`);
        bus.emit('agent-message', { agent: 'Media Studio', text: `✅ Generation complete. Saved to ${resultFile}` });
        bus.emit('notification', { 
            id: id, 
            title: 'Media Generated', 
            message: `${service} finished: ${prompt.substring(0, 30)}...`, 
            type: 'success', 
            timestamp: Date.now() 
        });

        return { status: "success", file: resultFile, metadata: { prompt, service, id } };
    }
}

export const orchestrator = new GoogleAIOrchestrator();
