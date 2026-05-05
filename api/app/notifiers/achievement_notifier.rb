# frozen_string_literal: true

# Generic achievement notifier — fires from Achievement#after_create_commit
# for any catalogue kind whose entry sets `notifier: :achievement`.
# Reads label + emoji from the Achievement record itself, so adding a
# new achievement kind doesn't require a new notifier class.
class AchievementNotifier < ApplicationNotifier
  deliver_by :action_cable do |config|
    config.channel = 'NotificationsChannel'
    config.stream = -> { recipient }
    config.message = -> { as_json }
  end

  required_param :achievement_id

  notification_methods do
    def title
      params[:title] || 'Achievement unlocked'
    end

    def meta
      params[:emoji].present? ? "#{params[:emoji]} #{params[:label]}" : params[:label]
    end

    def url
      params[:url]
    end
  end
end
