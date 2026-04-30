# frozen_string_literal: true

require 'test_helper'

class MilestoneNotifierTest < ActiveSupport::TestCase
  test 'creates a notification with kind = milestone' do
    plant = plants(:wilty)
    user = plant.space.user

    assert_difference -> { user.notifications.count }, 1 do
      MilestoneNotifier.with(
        record: plant,
        plant_id: plant.id,
        plant_nickname: plant.nickname,
        day_count: 30
      ).deliver(user)
    end

    notification = user.notifications.last
    assert_equal 'milestone', notification.kind
    assert_equal user, notification.recipient
  end

  test 'envelope title says N days with plant name' do
    plant = plants(:wilty)
    user = plant.space.user

    MilestoneNotifier.with(
      record: plant, plant_id: plant.id, plant_nickname: 'Wilty', day_count: 100
    ).deliver(user)

    envelope = user.notifications.last.as_json
    assert_equal '100 days with Wilty', envelope[:title]
    assert_nil envelope[:meta]
  end
end
