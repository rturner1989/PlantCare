# frozen_string_literal: true

# Shared base for water + feed care-due notifiers. Subclasses define
# `title` only — meta, url, delivery, and required params are common.
#
# Two subclasses (CareDue::WaterNotifier + CareDue::FeedNotifier) instead
# of one notifier with a `care_kind` discriminator: cleaner dedup queries
# (where type = 'CareDue::WaterNotifier' instead of loading rows +
# filtering in Ruby) and clearer semantics (water and feed are different
# events).
class CareDueNotifier < ApplicationNotifier
  deliver_by :action_cable do |config|
    config.channel = 'NotificationsChannel'
    config.stream = -> { recipient }
    config.message = -> { as_json }
  end

  required_param :plant_id
  required_param :days_overdue

  notification_methods do
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
