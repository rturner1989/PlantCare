# frozen_string_literal: true

require 'test_helper'

class CareDueNotifierTest < ActiveSupport::TestCase
  test 'creates a notification with kind = care_due for the plant owner' do
    plant = plants(:wilty)
    user = plant.space.user

    assert_difference -> { user.notifications.count }, 1 do
      CareDueNotifier.with(
        record: plant,
        plant_id: plant.id,
        plant_nickname: plant.nickname,
        care_kind: 'water',
        days_overdue: 2
      ).deliver(user)
    end

    notification = user.notifications.last
    assert_equal 'care_due', notification.kind
    assert_equal user, notification.recipient
  end

  test 'envelope title and meta render the plant + overdue copy' do
    plant = plants(:wilty)
    user = plant.space.user

    CareDueNotifier.with(
      record: plant, plant_id: plant.id, plant_nickname: 'Wilty',
      care_kind: 'water', days_overdue: 3
    ).deliver(user)

    envelope = user.notifications.last.as_json
    assert_equal 'Wilty needs water', envelope[:title]
    assert_equal '3 days overdue', envelope[:meta]
  end

  test 'meta says "due today" when days_overdue is zero' do
    plant = plants(:wilty)
    user = plant.space.user

    CareDueNotifier.with(
      record: plant, plant_id: plant.id, plant_nickname: 'Wilty',
      care_kind: 'feed', days_overdue: 0
    ).deliver(user)

    assert_equal 'due today', user.notifications.last.as_json[:meta]
  end

  test 'singular day in meta for one-day overdue' do
    plant = plants(:wilty)
    user = plant.space.user

    CareDueNotifier.with(
      record: plant, plant_id: plant.id, plant_nickname: 'Wilty',
      care_kind: 'water', days_overdue: 1
    ).deliver(user)

    assert_equal '1 day overdue', user.notifications.last.as_json[:meta]
  end
end
