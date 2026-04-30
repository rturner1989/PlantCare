# frozen_string_literal: true

class CareDue::FeedNotifier < CareDueNotifier
  notification_methods do
    def title
      "#{params[:plant_nickname]} needs feeding"
    end
  end
end
