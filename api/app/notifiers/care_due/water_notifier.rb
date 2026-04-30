# frozen_string_literal: true

class CareDue::WaterNotifier < CareDueNotifier
  notification_methods do
    def title
      "#{params[:plant_nickname]} needs water"
    end
  end
end
