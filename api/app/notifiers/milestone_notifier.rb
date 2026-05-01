# frozen_string_literal: true

class MilestoneNotifier < ApplicationNotifier
  deliver_by :action_cable do |config|
    config.channel = 'NotificationsChannel'
    config.stream = -> { recipient }
    config.message = -> { as_json }
  end

  required_param :plant_id
  required_param :day_count

  notification_methods do
    def title
      "#{params[:day_count]} days with #{params[:plant_nickname]}"
    end

    def meta
      nil
    end

    def url
      "/plants/#{params[:plant_id]}"
    end
  end
end
