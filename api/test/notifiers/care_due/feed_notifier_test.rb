# frozen_string_literal: true

require 'test_helper'

class CareDue::FeedNotifierTest < ActiveSupport::TestCase
  setup do
    @plant = plants(:wilty)
    @user = @plant.space.user
  end

  test 'creates a notification with kind = care_due_feed for the plant owner' do
    assert_difference -> { @user.notifications.count }, 1 do
      CareDue::FeedNotifier.with(
        record: @plant,
        plant_id: @plant.id,
        plant_nickname: @plant.nickname,
        days_overdue: 5
      ).deliver(@user)
    end

    assert_equal 'care_due_feed', @user.notifications.last.kind
  end

  test 'envelope title says plant needs feeding' do
    CareDue::FeedNotifier.with(
      record: @plant, plant_id: @plant.id, plant_nickname: 'Wilty', days_overdue: 4
    ).deliver(@user)

    envelope = @user.notifications.last.as_json
    assert_equal 'Wilty needs feeding', envelope[:title]
    assert_equal '4 days overdue', envelope[:meta]
  end
end
