export const SITE_TITLE = 'AI Briefs';
export const SITE_DESCRIPTION = 'Discover the best AI tools. Browse 500+ AI tools across 22 categories — free, freemium, and paid.';
export const SITE_URL = 'https://getaibriefs.com';
export const SITE_AUTHOR = 'AI Briefs';
export const BEEHIIV_FORM_URL = 'https://subscribe-forms.beehiiv.com/fda3e0ad-bcc8-4e4d-8f5b-123db9391be9';

export const CATEGORY_COLORS: Record<string, string> = {
	'ai-explained':   '#EEF3FF',
	'future-of-work': '#FFF4E6',
	'how-ai-works':   '#F0FFF4',
	'comparisons':    '#F5F0FF',
	'guides':         '#F0F9FF',
};

export interface ToolCategory {
	slug: string;
	name: string;
	emoji: string;
	description: string;
	subcategories: string[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
	{
		slug: 'ai-productivity',
		name: 'AI Productivity',
		emoji: '⚡',
		description: 'Boost your workflow with AI',
		subcategories: ['AI Assistant', 'AI Agent', 'AI Copilot', 'AI Search Engine', 'AI Email Assistant', 'AI Meeting Assistant', 'AI Note Taker', 'AI Resume Builder', 'AI Task Management', 'AI Scheduling', 'AI PDF', 'AI Report Generator', 'AI Documents Generator', 'AI Presentation Generator'],
	},
	{
		slug: 'ai-writing',
		name: 'AI Writing',
		emoji: '✍️',
		description: 'AI-powered writing and content',
		subcategories: ['AI Writing Assistants', 'AI Summarizer', 'AI Text Generator', 'AI Blog Generator', 'AI Copywriting', 'AI Story Generator', 'AI Rewriter', 'AI Grammar Checker', 'AI Essay Writer', 'AI Email Writer', 'AI Script Writing', 'AI Paraphraser', 'AI Cover Letter Generator', 'AI Proofreading'],
	},
	{
		slug: 'ai-video',
		name: 'AI Video',
		emoji: '🎬',
		description: 'Generate and edit videos with AI',
		subcategories: ['AI Video Generator', 'Text to Video', 'AI Video Editor', 'Image to Video', 'AI Short Video Generator', 'AI Animation Generator', 'AI Video Summarizer', 'AI Lip Sync Generator', 'AI Face Swap Video', 'AI Avatar Video Generator'],
	},
	{
		slug: 'ai-image',
		name: 'AI Image',
		emoji: '🖼️',
		description: 'Create and edit images with AI',
		subcategories: ['AI Image Generator', 'Text to Image', 'AI Photo Editor', 'AI Background Remover', 'AI Avatar Generator', 'AI Image Enhancer', 'AI Image Upscaler', 'AI Headshot Generator', 'AI Face Swap Generator', 'AI Product Photography', 'AI Watermark Remover', 'AI Photo Restoration'],
	},
	{
		slug: 'ai-art',
		name: 'AI Art',
		emoji: '🎨',
		description: 'Generate stunning AI artwork',
		subcategories: ['AI Art Generator', 'AI Logo Generator', 'AI Illustration Generator', 'AI Anime Generator', 'AI 3D Model Generator', 'AI Cartoon Generator', 'AI Graphic Design', 'AI Drawing', 'AI Poster Generator', 'AI Sticker Generator'],
	},
	{
		slug: 'ai-voice',
		name: 'AI Voice',
		emoji: '🎤',
		description: 'AI voice generation and cloning',
		subcategories: ['AI Text-to-Speech', 'AI Speech-to-Text', 'AI Transcription', 'AI Voice Generator', 'AI Voice Cloning', 'AI Voice Over', 'AI Dubbing', 'AI Voice Changer', 'AI Podcast'],
	},
	{
		slug: 'ai-music',
		name: 'AI Music',
		emoji: '🎵',
		description: 'Compose music with AI',
		subcategories: ['AI Music Generator', 'AI Song Generator', 'AI Lyrics Generator', 'AI Sound Effect Generator', 'AI Vocal Remover', 'AI Beat Generator', 'AI Melody Generator', 'AI Instrumental Generator'],
	},
	{
		slug: 'ai-chatbot',
		name: 'AI Chatbot',
		emoji: '💬',
		description: 'Conversational AI assistants',
		subcategories: ['AI Chatbot', 'AI Character', 'AI Roleplay', 'AI Dating Assistant'],
	},
	{
		slug: 'ai-vision',
		name: 'AI Vision',
		emoji: '👁️',
		description: 'Computer vision and image recognition',
		subcategories: ['AI Image Recognition', 'AI OCR', 'AI Face Recognition', 'AI Face Analyzer', 'AI Describe Image', 'Image to Prompt'],
	},
	{
		slug: 'ai-marketing',
		name: 'AI Marketing',
		emoji: '📢',
		description: 'AI tools for marketing and growth',
		subcategories: ['AI Marketing', 'AI SEO Tools', 'AI Lead Generation', 'AI Sales Assistant', 'AI Ad Generator', 'AI Email Marketing', 'AI Email Generator', 'SEO Writing AI', 'AI Digital Marketing'],
	},
	{
		slug: 'ai-coding',
		name: 'AI Coding',
		emoji: '💻',
		description: 'AI-powered coding and development',
		subcategories: ['AI Code Generator', 'AI Code Assistant', 'AI Developer Tools', 'No-Code & Low-Code', 'AI App Builder', 'AI Website Builder', 'AI Code Review', 'AI Testing'],
	},
	{
		slug: 'ai-learning',
		name: 'AI Learning',
		emoji: '📚',
		description: 'AI tools for education and learning',
		subcategories: ['AI Translate', 'AI Homework Helper', 'AI Language Learning', 'AI Quiz Generator', 'AI Flashcard Maker', 'AI Course', 'AI Coaching', 'AI Math', 'AI Mind Mapping'],
	},
	{
		slug: 'ai-social',
		name: 'AI Social',
		emoji: '📱',
		description: 'AI tools for social media',
		subcategories: ['AI Social Media Post Generator', 'AI YouTube', 'AI Twitter', 'AI Instagram', 'AI Hashtag', 'AI Meme Generator', 'AI TikTok', 'AI LinkedIn', 'AI Bio Generator'],
	},
	{
		slug: 'ai-business',
		name: 'AI Business',
		emoji: '💼',
		description: 'AI tools for business operations',
		subcategories: ['AI Customer Service', 'AI Workflow', 'AI Recruiting', 'AI CRM', 'AI Project Management', 'AI Call Center', 'AI Interview Assistant'],
	},
	{
		slug: 'ai-research',
		name: 'AI Research',
		emoji: '🔬',
		description: 'AI-powered research and analysis',
		subcategories: ['AI Research Tool', 'AI For Data Analytics', 'AI Predictions', 'AI Research Papers', 'AI Data Mining'],
	},
	{
		slug: 'ai-insights',
		name: 'AI Insights',
		emoji: '📊',
		description: 'Data analysis and business intelligence',
		subcategories: ['AI Consulting', 'AI Business Ideas Generator', 'AI Crypto', 'AI Business Name Generator', 'AI Domain Name Generator'],
	},
	{
		slug: 'ai-life',
		name: 'AI Life',
		emoji: '🌟',
		description: 'AI for everyday life',
		subcategories: ['AI Travel', 'AI Trip Planner', 'AI Fitness', 'AI Recipe', 'AI Shopping Assistant', 'AI Outfit Generator', 'AI News', 'AI Gift Ideas'],
	},
	{
		slug: 'ai-health',
		name: 'AI Health',
		emoji: '🏥',
		description: 'AI tools for health and wellness',
		subcategories: ['AI Healthcare', 'AI Mental Health', 'AI Therapist', 'AI Medical Diagnosis', 'AI Symptom Checker'],
	},
	{
		slug: 'ai-legal',
		name: 'AI Legal',
		emoji: '⚖️',
		description: 'AI tools for legal and finance',
		subcategories: ['AI Legal Assistant', 'AI For Finance', 'AI Investing', 'AI Contract Review', 'AI Contract Generator', 'AI Accounting', 'AI Tax Assistant', 'AI Real Estate'],
	},
	{
		slug: 'ai-design',
		name: 'AI Design',
		emoji: '✏️',
		description: 'AI-powered interior and space design',
		subcategories: ['AI Interior Design', 'AI Room Planner', 'AI Landscape Generator', 'AI Kitchen Design', 'AI Floor Plan Generator'],
	},
	{
		slug: 'ai-detection',
		name: 'AI Detection',
		emoji: '🔍',
		description: 'Detect AI-generated content',
		subcategories: ['AI Detector', 'AI Content Detector', 'AI Plagiarism Checker', 'Humanizer AI', 'AI Image Detector'],
	},
	{
		slug: 'others',
		name: 'Others',
		emoji: '🔮',
		description: 'Other AI tools and utilities',
		subcategories: ['Large Language Models', 'AI Models', 'Open Source AI', 'AI Games'],
	},
];

export const PRICING_BADGE: Record<string, { bg: string; text: string; label: string }> = {
	free:     { bg: '#E0F5EE', text: '#00875A', label: 'Free' },
	freemium: { bg: '#EEF3FF', text: '#3B5BDB', label: 'Freemium' },
	paid:     { bg: '#FFF4E6', text: '#E67700', label: 'Paid' },
};
