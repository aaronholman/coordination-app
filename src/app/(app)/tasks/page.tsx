'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  project_id: string | null;
  projects?: {
    name: string;
  } | null;
}

type TaskStatus = 'all' | 'not_started' | 'in_progress' | 'done';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<TaskStatus>('all');
  const supabase = createClient();

  useEffect(() => {
    const fetchTasks = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      let query = supabase
        .from('tasks')
        .select(
          `
        id,
        title,
        status,
        due_date,
        assigned_to,
        project_id,
        projects (
          name
        )
      `
        )
        .eq('created_by', user.id)
        .neq('status', 'abandoned')
        .order('due_date', { ascending: true, nullsFirst: true });

      if (activeFilter !== 'all') {
        query = query.eq('status', activeFilter);
      }

      const { data } = await query;
      setTasks(data as Task[]);
      setLoading(false);
    };

    fetchTasks();
  }, [activeFilter, supabase]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'bg-gray-100 text-gray-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'done':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'not_started':
        return 'Not Started';
      case 'in_progress':
        return 'In Progress';
      case 'done':
        return 'Done';
      default:
        return status;
    }
  };

  const filters: { label: string; value: TaskStatus }[] = [
    { label: 'All', value: 'all' },
    { label: 'Not Started', value: 'not_started' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Done', value: 'done' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-2">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
          New Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={`px-4 py-2 border-b-2 transition-colors font-medium ${
              activeFilter === filter.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading tasks...</div>
      ) : tasks.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Task
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Project
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Assigned To
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Status
                </th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-gray-900">
                    {task.title}
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-sm">
                    {task.projects?.name || '-'}
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-sm">
                    {task.assigned_to || '-'}
                  </td>
                  <td className="py-3 px-6">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        task.status
                      )}`}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-gray-600 text-sm">
                    {task.due_date
                      ? format(new Date(task.due_date), 'MMM d, yyyy')
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No tasks found</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Create your first task
          </button>
        </div>
      )}
    </div>
  );
}
