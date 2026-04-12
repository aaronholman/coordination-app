import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export const revalidate = 0;

interface Recipe {
  id: string;
  name: string;
  url: string | null;
  tags: string[] | null;
}

export default async function RecipesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: recipes } = await supabase
    .from('recipes')
    .select('id, name, url, tags')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-600 mt-2">
            {recipes?.length || 0} recipe{recipes && recipes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {recipes && recipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(recipes as Recipe[]).map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col"
            >
              <h2 className="text-lg font-bold text-gray-900 mb-3">
                {recipe.name}
              </h2>

              {recipe.tags && recipe.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap mb-4">
                  {recipe.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {recipe.url && (
                <div className="mt-auto pt-4 border-t border-gray-200">
                  <a
                    href={recipe.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2"
                  >
                    View Recipe
                    <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No recipes yet</p>
        </div>
      )}
    </div>
  );
}
