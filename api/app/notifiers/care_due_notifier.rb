# frozen_string_literal: true

class CareDueNotifier < ApplicationNotifier
  deliver_by :action_cable do |config|
    config.channel = 'NotificationsChannel'
    config.stream = -> { recipient }
    config.message = -> { as_json }
  end

  required_param :plant_id
  required_param :care_kind
  required_param :days_overdue

  notification_methods do
    def title
      "#{params[:plant_nickname]} needs #{params[:care_kind]}"
    end

    def meta
      overdue = params[:days_overdue].to_i
      return 'due today' if overdue.zero?

      "#{overdue} #{'day'.pluralize(overdue)} overdue"
    end

    def url
      "/plants/#{params[:plant_id]}"
    end
  end
end
