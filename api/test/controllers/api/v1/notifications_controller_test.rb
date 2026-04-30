# frozen_string_literal: true

require 'test_helper'

class Api::V1::NotificationsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:john)
    @other_user = users(:jane)
    @plant = plants(:wilty)
  end

  test 'index requires authentication' do
    get api_v1_notifications_path, as: :json

    assert_response :unauthorized
  end

  test 'index returns the current users notifications + unread_count' do
    deliver_milestone(@user, day_count: 30)
    deliver_milestone(@user, day_count: 100)

    get api_v1_notifications_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 2, json['unread_count']
    assert_equal 2, json['notifications'].size
    assert_equal %w[milestone milestone], json['notifications'].pluck('kind')
  end

  test 'index returns notifications newest first' do
    older = deliver_milestone(@user, day_count: 30)
    older.update!(created_at: 2.days.ago)
    deliver_milestone(@user, day_count: 100)

    get api_v1_notifications_path, headers: auth_headers(@user), as: :json

    titles = response.parsed_body['notifications'].pluck('title')
    assert_equal '100 days with Wilty', titles.first
  end

  test 'index does not leak notifications to other users' do
    deliver_milestone(@user, day_count: 30)

    get api_v1_notifications_path, headers: auth_headers(@other_user), as: :json

    json = response.parsed_body
    assert_equal 0, json['unread_count']
    assert_equal 0, json['notifications'].size
  end

  test 'update marks a single notification as read and decrements unread_count' do
    notification = deliver_milestone(@user, day_count: 30)
    deliver_milestone(@user, day_count: 100)

    patch api_v1_notification_path(notification), headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 1, json['unread_count']
    assert_not_nil json['notification']['read_at']
    assert_not_nil notification.reload.read_at
  end

  test 'update returns 404 when the notification belongs to another user' do
    notification = deliver_milestone(@user, day_count: 30)

    patch api_v1_notification_path(notification), headers: auth_headers(@other_user), as: :json

    assert_response :not_found
  end

  test 'seen marks every unseen notification as seen without marking them read' do
    deliver_milestone(@user, day_count: 30)
    deliver_milestone(@user, day_count: 100)

    patch seen_api_v1_notifications_path, headers: auth_headers(@user), as: :json

    assert_response :ok
    json = response.parsed_body
    assert_equal 2, json['unread_count']
    @user.notifications.each do |notification|
      assert_not_nil notification.seen_at
      assert_nil notification.read_at
    end
  end

  test 'seen does not touch other users notifications' do
    deliver_milestone(@other_user, day_count: 30)

    patch seen_api_v1_notifications_path, headers: auth_headers(@user), as: :json

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
