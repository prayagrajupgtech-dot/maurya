import { useState, useEffect } from "react";
import { useTheme } from "../../App";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_user_id: string | null;
  related_application_id: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  new_user: "👤",
  application_started: "📝",
  application_submitted: "📋",
  payment_success: "💳",
  payment_failed: "❌",
  card_issued: "🪪",
};

export default function AdminNotifications() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin-notifications");
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin-notifications", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.related_user_id) {
      window.location.hash = `#/admin/users/${notification.related_user_id}`;
    } else if (notification.related_application_id) {
      window.location.hash = `#/admin/applications/${notification.related_application_id}`;
    }
  };

  return (
    <div
      className={`rounded-2xl border ${
        isDark
          ? "bg-white/5 border-white/10"
          : "bg-gray-100 border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h2
            className={`text-lg font-semibold ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500/20 text-amber-500 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-amber-500 hover:text-amber-400 transition-colors"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Loading notifications...
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 text-center">
          <div
            className={`text-sm ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            No notifications yet
          </div>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                !notification.read
                  ? "bg-amber-500/5 border-l-2 border-l-amber-500"
                  : isDark
                  ? "hover:bg-white/5"
                  : "hover:bg-gray-200/50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">
                  {TYPE_ICONS[notification.type] || "📌"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-medium ${
                        isDark ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                  <p
                    className={`text-sm mt-1 ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {notification.message}
                  </p>
                  <span
                    className={`text-xs ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
