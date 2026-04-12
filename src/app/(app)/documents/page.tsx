import { createClient } from '@/lib/supabase/server';

export const revalidate = 0;

interface Document {
  id: string;
  name: string;
  tags: string[] | null;
  project_id: string | null;
  projects?: {
    name: string;
  } | null;
}

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  const { data: documents } = await supabase
    .from('documents')
    .select(
      `
      id,
      name,
      tags,
      project_id,
      projects (
        name
      )
    `
    )
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600 mt-2">
            {documents?.length || 0} document{documents && documents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {documents && documents.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Name
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Project
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Tags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(documents as Document[]).map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {doc.name}
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-sm">
                    {doc.projects?.name || '-'}
                  </td>
                  <td className="py-3 px-6">
                    <div className="flex gap-1 flex-wrap">
                      {doc.tags && doc.tags.length > 0 ? (
                        doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">No tags</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No documents yet</p>
        </div>
      )}
    </div>
  );
}
