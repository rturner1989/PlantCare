# frozen_string_literal: true

require 'test_helper'

class Api::V1::NotificationsSeenControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @other_user = users(:jane)
    @plant = plants(:wilty)
  end

  test 'requires authentication' do
    post api_v1_notifications_seen_path, as: :json

    assert_response :unauthorized
  end

  test 'marks every unseen notification as seen without marking them read' do
    deliver_milestone(@user, day_count: 30)
    deliver_milestone(@user, day_count: 100)

    post api_v1_notifications_seen_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    assert_equal 2, response.parsed_body['unread_count']
    @user.notifications.each do |notification|
      assert_not_nil notification.seen_at
      assert_nil notification.read_at
    end
  end

  test 'does not touch other users notifications' do
    deliver_milestone(@other_user, day_count: 30)

    post api_v1_notifications_seen_path, headers: auth_headers(@user), as: :json

    assert_nil @other_user.notifications.first.seen_at
  end

  private def deliver_milestone(user, day_count:)
    MilestoneNotifier.with(
      record: @plant,
      plant_id: @plant.id,
      plant_nickname: @plant.nickname,
      day_count: day_count
    ).deliver(user)
    user.notifications.last
  end
end
