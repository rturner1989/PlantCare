# frozen_string_literal: true

class ApplicationNotifier < Noticed::Event
  notification_methods do
    # Stable string the client switches on. `PlantAddedNotifier` →
    # `'plant_added'`. Keeps client templates decoupled from Ruby class names.
    def kind
      event.type.delete_suffix('Notifier').underscore
    end

    def as_json(_options = {})
      {
        id: id,
        kind: kind,
        title: title,
        meta: respond_to?(:meta) ? meta : nil,
        url: respond_to?(:url) ? url : nil,
        params: params,
        read_at: read_at,
        seen_at: seen_at,
        created_at: created_at
      }
    end
  end
end
