import { createClient } from '@/lib/supabase/server';
import { Film, Tv, Radio, BookOpen } from 'lucide-react';

export const revalidate = 0;

interface Recommendation {
  id: string;
  name: string;
  type: string;
  description: string | null;
  origin: string | null;
}

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: recommendations } = await supabase
    .from('recommendations')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const getIcon = (type: string) => {
    switch (type) {
      case 'show':
        return <Tv size={20} />;
      case 'movie':
        return <Film size={20} />;
      case 'podcast':
        return <Radio size={20} />;
      case 'book':
        return <BookOpen size={20} />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'show':
        return 'bg-purple-100 text-purple-700';
      case 'movie':
        return 'bg-blue-100 text-blue-700';
      case 'podcast':
        return 'bg-green-100 text-green-700';
      case 'book':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const typeGroups = {
    show: [],
    movie: [],
    podcast: [],
    book: [],
    other: [],
  } as Record<string, Recommendation[]>;

  (recommendations as Recommendation[])?.forEach((rec) => {
    if (typeGroups[rec.type]) {
      typeGroups[rec.type].push(rec);
    }
  });

  const hasRecommendations = recommendations && recommendations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recommendations</h1>
        <p className="text-gray-600 mt-2">
          {recommendations?.length || 0} recommendation{recommendations && recommendations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {hasRecommendations ? (
        <div className="space-y-8">
          {Object.entries(typeGroups).map(([type, recs]) =>
            recs.length > 0 ? (
              <div key={type}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 capitalize">
                  {type}s ({recs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recs.map((rec) => (
                    <div
                      key={rec.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`p-2 rounded-lg ${getTypeColor(rec.type)}`}
                        >
                          {getIcon(rec.type)}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTypeColor(
                            rec.type
                          )}`}
                        >
                          {rec.type}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 mb-2">
                        {rec.name}
                      </h3>

                      {rec.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {rec.description}
                        </p>
                      )}

                      {rec.origin && (
                        <p className="text-xs text-gray-500 pt-3 border-t border-gray-200">
                          Recommended by: <span className="font-medium">{rec.origin}</span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No recommendations yet</p>
        </div>
      )}
    </div>
  );
}
