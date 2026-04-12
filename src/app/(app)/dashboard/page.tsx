import { createClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';

export const revalidate = 0;

interface SummaryCard {
  label: string;
  value: number;
  color: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  updated_at: string;
  project_id: string | null;
  projects?: {
    name: string;
  } | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not authenticated</div>;
  }

  // Get user profile for greeting
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const displayName = (profile as any)?.full_name || 'there';

  // Get projects count - active ones
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id')
    .eq('created_by', user.id)
    .neq('status', 'done');

  // Get tasks count - open ones
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('id')
    .eq('created_by', user.id)
    .neq('status', 'done');

  // Get this week's tasks - we'll count those due this week
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dateStr = today.toISOString().split('T')[0];
  const nextDateStr = nextWeek.toISOString().split('T')[0];

  const { data: weekTasks } = await supabase
    .from('tasks')
    .select('id')
    .eq('created_by', user.id)
    .neq('status', 'done')
    .gte('due_date', dateStr)
    .lte('due_date', nextDateStr);

  // Get recent tasks
  const { data: recentTasks } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      updated_at,
      project_id,
      projects (
        name
      )
    `)
    .eq('created_by', user.id)
    .order('updated_at', { ascending: false })
    .limit(5);

  const summaryCards: SummaryCard[] = [
    {
      label: 'Active Projects',
      value: projects?.length || 0,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Open Tasks',
      value: tasks?.length || 0,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Due This Week',
      value: weekTasks?.length || 0,
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  // Get current hour for greeting
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900">
          {greeting}, {displayName}
        </h1>
        <p className="text-gray-600 mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <p className="text-gray-600 text-sm font-medium mb-2">
              {card.label}
            </p>
            <p className={`text-4xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Recent Tasks</h2>
        </div>
        {recentTasks && recentTasks.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {(recentTasks as Task[]).map((task) => (
              <div
                key={task.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {task.title}
                    </h3>
                    {task.projects && (
                      <p className="text-sm text-gray-500 mt-1">
                        {task.projects.name}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === 'not_started'
                          ? 'bg-gray-100 text-gray-700'
                          : task.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700'
                            : task.status === 'done'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {task.status === 'not_started'
                        ? 'Not Started'
                        : task.status === 'in_progress'
                          ? 'In Progress'
                          : task.status === 'done'
                            ? 'Done'
                            : 'Abandoned'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(task.updated_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            <p>No recent tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}
