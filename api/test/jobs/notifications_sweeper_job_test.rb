# frozen_string_literal: true

require 'test_helper'

class NotificationsSweeperJobTest < ActiveJob::TestCase
  test 'fires CareDueNotifier for plants with water overdue' do
    plant = plants(:wilty)
    plant.update!(last_watered_at: 60.days.ago, calculated_watering_days: 7)
    user = plant.space.user

    NotificationsSweeperJob.perform_now

    care_dues = user.notifications.where(type: 'CareDueNotifier::Notification')
    water_notification = care_dues.find { |n| n.event.params[:care_kind] == 'water' }
    assert_not_nil water_notification, 'expected a water CareDueNotifier'
    assert_equal 'care_due', water_notification.kind
  end

  test 'does not refire CareDue within the 24h dedup window' do
    plant = plants(:wilty)
    plant.update!(last_watered_at: 60.days.ago, calculated_watering_days: 7)
    user = plant.space.user

    NotificationsSweeperJob.perform_now
    initial = user.notifications.count

    NotificationsSweeperJob.perform_now
    assert_equal initial, user.notifications.count
  end

  test 'fires MilestoneNotifier when a plant hits a 30-day anniversary today' do
    plant = plants(:wilty)
    user = plant.space.user

    travel_to plant.created_at + 30.days do
      assert_difference -> { milestones_for(user, plant).count }, 1 do
        NotificationsSweeperJob.perform_now
      end
    end

    milestone = milestones_for(user, plant).last
    assert_equal 30, milestone.event.params[:day_count]
  end

  test 'milestone is idempotent — re-running the same day does not duplicate' do
    plant = plants(:wilty)
    user = plant.space.user

    travel_to plant.created_at + 30.days do
      NotificationsSweeperJob.perform_now
      initial = milestones_for(user, plant).count

      NotificationsSweeperJob.perform_now
      assert_equal initial, milestones_for(user, plant).count
    end
  end

  test 'does not fire any milestone for a plant whose age does not match a milestone day' do
    plant = plants(:wilty)
    user = plant.space.user

    travel_to plant.created_at + 17.days do
      NotificationsSweeperJob.perform_now
    end

    assert_equal 0, milestones_for(user, plant).count
  end

  private def milestones_for(user, plant)
    user.notifications
        .where(type: 'MilestoneNotifier::Notification')
        .joins(:event)
        .where(noticed_events: { record_type: 'Plant', record_id: plant.id })
  end
end
