'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UseCase {
  title: string;
  partner_name: string;
  url: string;
  text: string;
  score: number;
}

interface ProjectData {
  companyName: string;
  description: string;
  useCases: UseCase[];
  timestamp: number;
}

export default function ResultsPage() {
  const router = useRouter();
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [expandedCases, setExpandedCases] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Load project data from localStorage
    const storedData = localStorage.getItem('currentProject');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setProjectData(data);
      } catch (error) {
        console.error('Error parsing stored project data:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleNewSearch = () => {
    // Clear current project from localStorage
    localStorage.removeItem('currentProject');
    // Navigate back to home
    router.push('/');
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const toggleUseCase = (index: number) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedCases(newExpanded);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-zinc-500">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData || !projectData.useCases || projectData.useCases.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-semibold text-zinc-900 mb-4">No Results Found</h2>
            <p className="text-zinc-600 mb-6">No use cases were found for your search.</p>
            <button
              onClick={handleNewSearch}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
            >
              Start New Search
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-zinc-50 to-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center"
          >
            ← Back
          </button>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 mb-4">Use Case Results</h1>
            <div className="space-y-2">
              {projectData.companyName && (
                <div>
                  <span className="font-bold text-zinc-900">Company Name:</span>{' '}
                  <span className="text-zinc-700">{projectData.companyName}</span>
                </div>
              )}
              <div>
                <button
                  onClick={toggleDescription}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div>
                    <span className="font-bold text-zinc-900">Description:</span>{' '}
                    {!isDescriptionExpanded && (
                      <span className="text-zinc-600">
                        {projectData.description.length > 100
                          ? `${projectData.description.substring(0, 100)}...`
                          : projectData.description}
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-zinc-600 transition-transform ${isDescriptionExpanded ? 'transform rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isDescriptionExpanded && (
                  <div className="mt-2 text-zinc-600 whitespace-pre-wrap">
                    {projectData.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-4">
            Found {projectData.useCases.length} Use Case{projectData.useCases.length !== 1 ? 's' : ''}
          </h2>
          <div className="space-y-6">
            {projectData.useCases.map((useCase, index) => (
              <div
                key={index}
                className="border border-zinc-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-zinc-900 flex-1 pr-4">
                    {useCase.title || 'Untitled Use Case'}
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded whitespace-nowrap">
                    {(useCase.score * 100).toFixed(1)}% match
                  </span>
                </div>
                
                {useCase.partner_name && (
                  <p className="text-sm text-zinc-600 mb-3">
                    <span className="font-medium">Partner:</span> {useCase.partner_name}
                  </p>
                )}
                
                {useCase.text && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleUseCase(index)}
                      className="flex items-center justify-between w-full text-left mb-2"
                    >
                      <span className="font-bold text-zinc-900">Description:</span>
                      <svg
                        className={`w-5 h-5 text-zinc-600 transition-transform ${expandedCases.has(index) ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedCases.has(index) ? (
                      <p className="text-zinc-700 whitespace-pre-wrap leading-relaxed">
                        {useCase.text}
                      </p>
                    ) : (
                      <p className="text-zinc-700 leading-relaxed">
                        {useCase.text.length > 200
                          ? `${useCase.text.substring(0, 200)}...`
                          : useCase.text}
                      </p>
                    )}
                  </div>
                )}
                
                {useCase.url && (
                  <a
                    href={useCase.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:underline font-medium"
                  >
                    View case study →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleNewSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-md transition-colors duration-200"
          >
            Start New Search
          </button>
        </div>
      </div>
    </div>
  );
}

