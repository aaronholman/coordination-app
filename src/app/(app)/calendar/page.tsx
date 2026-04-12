import { startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

export const revalidate = 0;

export default function CalendarPage() {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the weekday of the first day (0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();

  // Pad with empty days from previous month
  const paddingDays = Array(firstDayOfWeek).fill(null);
  const calendarDays = [...paddingDays, ...days];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthName = monthStart.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
        <p className="text-gray-600 mt-2">Google Calendar integration coming soon</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        {/* Month Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">{monthName}</h2>
        </div>

        {/* Calendar */}
        <div className="space-y-4">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-600 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, idx) => {
              const isToday = day && isSameDay(day, today);
              const isCurrentMonth = day && isSameMonth(day, today);

              return (
                <div
                  key={idx}
                  className={`aspect-square flex items-center justify-center rounded-lg border font-medium ${
                    !day
                      ? 'bg-gray-50 border-gray-100'
                      : isToday
                        ? 'bg-blue-600 text-white border-blue-600'
                        : isCurrentMonth
                          ? 'bg-white border-gray-200 text-gray-900 hover:bg-gray-50'
                          : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}
                >
                  {day && day.getDate()}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-center font-medium">
            We're integrating Google Calendar to show your events here. Coming soon!
          </p>
        </div>
      </div>
    </div>
  );
}
