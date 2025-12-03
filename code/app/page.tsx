'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseCase {
  title: string;
  partner_name: string;
  url: string;
  text: string;
  score: number;
}

export default function Home() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasStoredResults, setHasStoredResults] = useState(false);

  useEffect(() => {
    // Load previous project data if available (for back navigation)
    const storedData = localStorage.getItem('currentProject');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setCompanyName(data.companyName || '');
        setDescription(data.description || '');
        // Check if there are use cases stored
        if (data.useCases && data.useCases.length > 0) {
          setHasStoredResults(true);
        }
      } catch (error) {
        console.error('Error loading stored project data:', error);
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    // Clear previous project data when starting new search
    localStorage.removeItem('currentProject');
    setHasStoredResults(false);

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/use-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyName.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch use cases');
      }

      const data = await response.json();
      const useCases = data.useCases || [];

      // Save project data to localStorage
      const projectData = {
        companyName: companyName.trim(),
        description: description.trim(),
        useCases: useCases,
        timestamp: Date.now(),
      };
      localStorage.setItem('currentProject', JSON.stringify(projectData));

      // Navigate to results page
      router.push('/results');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const perplexityPrompt = companyName 
    ? `give me an extensive description of ${companyName}`
    : 'give me an extensive description of [company name]';
  
  const perplexityUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(perplexityPrompt)}`;

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">
            Use Case Finder
          </h1>
          <p className="text-lg text-zinc-600">
            Find relevant use cases based on your company information
          </p>
        </div>

        {/* View Stored Results Button */}
        {hasStoredResults && (
          <div className="mb-6">
            <button
              onClick={() => router.push('/results')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Previous Results
            </button>
          </div>
        )}

        {/* Perplexity Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-900 mb-1">
                Need help with company description?
              </h3>
              <p className="text-sm text-blue-800 mb-2">
                Use this prompt in Perplexity to get an extensive description:
              </p>
              <div className="bg-white border border-blue-200 rounded p-2 mb-2">
                <code className="text-sm text-blue-900 font-mono">
                  {perplexityPrompt}
                </code>
              </div>
              <a
                href={perplexityUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Open in Perplexity →
              </a>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-2">
                Company Name (Optional)
              </label>
              <input
                type="text"
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your company name"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-zinc-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="w-full px-4 py-2 border border-zinc-300 rounded-md bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Describe what your company does, the sector you're in, or what you're looking for..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-md transition-colors duration-200"
            >
              {loading ? 'Searching...' : 'Find Use Cases'}
            </button>
          </div>
        </form>

        {!loading && !error && (
          <div className="text-center py-12">
            <p className="text-zinc-500">
              Enter your company information above to find relevant use cases
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
